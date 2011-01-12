class ApplicationController < ActionController::Base
  layout 'application'
  helper :all # include all helpers, all the time

  protect_from_forgery # See ActionController::RequestForgeryProtection for details
  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password

  before_filter :show_progress

  private

  # Small helper to show or hide progress
  def show_progress(progress_visible = true)
    @show_progress = progress_visible
  end

  def self.caches_all_pages
    after_filter { |c| c.cache_page }
  end
end
