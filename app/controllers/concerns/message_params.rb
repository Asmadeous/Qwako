# A message from the website: text in `body`, and any files in `files[]`
# (sent as multipart form data).
module MessageParams
  extend ActiveSupport::Concern

  private
    def message_files
      Array(params[:files]).select { |file| file.is_a?(ActionDispatch::Http::UploadedFile) }
    end

    def build_message(conversation)
      Message.new(conversation:, sender: Current.user, body: params[:body].to_s, files: message_files)
    end
end
