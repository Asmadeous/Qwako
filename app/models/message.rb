class Message < ApplicationRecord
  MAX_FILES = 10
  MAX_FILE_BYTES = 25.megabytes
  # Pictures a browser can show safely inside the conversation.
  PREVIEW_TYPES = %w[image/jpeg image/png image/webp image/gif].freeze

  belongs_to :conversation
  belongs_to :sender, class_name: "User"
  # Any kind of file (documents, photos, ID scans, PDFs); only the guest and
  # the owner's team can download them.
  has_many_attached :files

  normalizes :body, with: ->(body) { body.strip }
  validates :body, presence: true, unless: -> { files.attached? }
  validates :body, length: { maximum: 4000 }
  validate :files_within_limits

  after_create_commit -> { ConversationChannel.broadcast_to(conversation, { message: payload }) }

  # What the website shows for a message, over the API and the websocket.
  def payload
    slice(:id, :body, :created_at).merge(sender_name: sender.name, from_owner: sender.team?, sender_id:,
      files: files.map { |file| file_json(file) })
  end

  # The body, or what was sent when there's no text.
  def summary
    return body if body.present?

    files.size == 1 ? "Sent a file: #{files.first.filename}" : "Sent #{files.size} files"
  end

  private
    def file_json(file)
      path = "/api/v1/message_files/#{file.id}"
      { id: file.id, name: file.filename.to_s, size: file.byte_size, content_type: file.content_type, url: path,
        preview_url: (file.content_type.in?(PREVIEW_TYPES) ? "#{path}?inline=1" : nil) }
    end

    def files_within_limits
      return unless files.attached?

      errors.add(:files, "can be at most #{MAX_FILES} per message") if files.size > MAX_FILES
      too_big = files.select { |file| file.byte_size > MAX_FILE_BYTES }
      errors.add(:files, "must each be 25 MB or smaller (#{too_big.map { |f| f.filename }.join(", ")})") if too_big.any?
    end
end
