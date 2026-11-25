module Api
  module V1
    # Downloads a file sent in a conversation. Only that conversation's guest and
    # the owner's team may open it; the browser gets a link that expires in minutes.
    class MessageFilesController < ApplicationController
      include ActiveStorage::SetCurrent

      def show
        file = ActiveStorage::Attachment.find_by!(id: params[:id], record_type: "Message", name: "files")
        conversation = file.record.conversation
        raise ActiveRecord::RecordNotFound unless Current.user.team? || conversation.guest_id == Current.user.id

        inline = params[:inline].present? && file.content_type.in?(Message::PREVIEW_TYPES)
        url = file.blob.url(expires_in: 5.minutes, disposition: inline ? :inline : :attachment)
        if file.blob.service.is_a?(ActiveStorage::Service::DiskService)
          # A relative Location keeps the browser on the address it used; redirect_to
          # would add this server's own host, which behind a proxy is the wrong one.
          response.headers["Location"] = URI.parse(url).request_uri
          head :found
        else
          redirect_to url, allow_other_host: true
        end
      end
    end
  end
end
