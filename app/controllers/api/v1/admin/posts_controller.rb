module Api
  module V1
    module Admin
      # Writing, publishing and removing blog posts.
      class PostsController < ApplicationController
        before_action :require_admin
        before_action -> { @post = Post.find(params[:id]) }, only: %i[show update destroy]

        def index
          posts = Post.includes(:author).order(Arel.sql("published_at IS NULL DESC, published_at DESC, updated_at DESC, id DESC"))
          rows, meta = page_of(posts, 25)
          render json: { posts: rows.map { |post| row(post) }, **meta }
        end

        def show
          render json: { post: row(@post).merge(body: @post.body) }
        end

        def create
          post = Post.new(post_params.merge(author: Current.user))
          return render_validation_errors(post) unless post.save

          audit("publish_post", post, "Published the blog post \"#{post.title}\"") if post.published_at
          render json: { post: row(post).merge(body: post.body) }, status: :created
        end

        def update
          was_published = @post.published_at.present?
          return render_validation_errors(@post) unless @post.update(post_params)

          if was_published != @post.published_at.present?
            audit(@post.published_at ? "publish_post" : "unpublish_post", @post,
              "#{@post.published_at ? "Published" : "Unpublished"} the blog post \"#{@post.title}\"")
          end
          render json: { post: row(@post).merge(body: @post.body) }
        end

        def destroy
          @post.destroy!
          audit("delete_post", @post, "Deleted the blog post \"#{@post.title}\"")
          head :no_content
        end

        private
          def post_params
            raw = params[:post]
            raw.is_a?(ActionController::Parameters) ? raw.permit(:title, :slug, :excerpt, :body, :cover_url, :publish) : {}
          end

          def row(post)
            post_summary_json(post).merge(published: post.published_at.present?, updated_at: post.updated_at)
          end
      end
    end
  end
end
