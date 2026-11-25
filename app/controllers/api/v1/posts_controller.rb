module Api
  module V1
    # The public blog.
    class PostsController < ApplicationController
      allow_unauthenticated_access

      def index
        rows, meta = page_of(Post.published.includes(:author).order(published_at: :desc, id: :desc), 12)
        render json: { posts: rows.map { |post| post_summary_json(post) }, **meta }
      end

      def show
        post = Post.published.includes(:author).find_by!(slug: params[:id])
        render json: { post: post_summary_json(post).merge(body: post.body) }
      end
    end
  end
end
