load_paths << File.join(File.dirname(__FILE__), 'deploy', 'tasks')

require 'capistrano/ext/multistage'

set :application, "issuemapper"
set :stages, %(staging production qa)
set :repository,  "git@github.com:fortiusone/issuemap.git"
set :scm, :git 
set :use_sudo, true
set :user,          "root"
set :deploy_user,   "root"
default_run_options[:pty] = true
ssh_options[:forward_agent] = true

# If you have previously been relying upon the code to start, stop 
# and restart your mongrel application, or if you rely on the database
# migration code, please uncomment the lines you require below

# If you are deploying a rails app you probably need these:

#load 'ext/rails-database-migrations.rb'
#load 'ext/rails-shared-directories.rb'

# There are also new utility libaries shipped with the core these 
# include the following, please see individual files for more
# documentation, or run `cap -vT` with the following lines commented
# out to see what they make available.

# load 'ext/spinner.rb'              # Designed for use with script/spin
# load 'ext/passenger-mod-rails.rb'  # Restart task for use with mod_rails
# load 'ext/web-disable-enable.rb'   # Gives you web:disable and web:enable

set :deploy_to, "/fortiusone/live/apps/issuemapper"

# If you aren't using Subversion to manage your source code, specify
# your SCM below:
# set :scm, :subversion
# see a full list by running "gem contents capistrano | grep 'scm/'"

set :appserver, :passenger
set :deploy_via, :remote_cache
set :user, "root"

desc "Re-establish symlinks"
task :symlink do
  run <<-CMD
    ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml &&
    ln -nfs #{shared_path}/config/config.yml   #{release_path}/config/config.yml
  CMD
end

desc "Re-establish staging database"
task :symlink_db do
  run <<-CMD
    ln -nfs #{shared_path}/staging.sqlite3 #{release_path}/db/staging.sqlite3
  CMD
end

namespace :deploy do 
  task :restart do 
    run "touch #{current_path}/tmp/restart.txt"
  end
end

namespace :tail do 
  desc "View the server log"
  task :log, :roles => :app do
    # stream "tail -f #{shared_path}/log/production.log{,.0,.1,.2,.3,.4,.5,.6,.7}"
    stream "tail -f #{current_path}/log/production.log"
  end
end
