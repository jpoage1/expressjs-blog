local app_name = "Express Blog"
local repo = "ssh://git@git.jasonpoage.vpn:29418/jason/express-blog.git"
local config_dir = "/srv/jasonpoage.com/env/"
-- 1. Static Lookups
local base = "/srv/jasonpoage.com"
local deployments = base .. "/deployments"

function get_config(env_key)
	-- Specific folder name for this environment
	local instance_name = "blog-" .. env_key
	local deploy_link = deployments .. "/" .. instance_name

	return {
		deploy_link = deploy_link,
		config_file = config_dir .. env_key .. ".toml",
		service_name = "expressjs-blog@" .. env_key .. ".service",
		-- Tracking which deployments were successful
		get_release_dir = function(timestamp)
			return deploy_link .. "-" .. timestamp
		end,
		count = (env_key == "release") and 5 or 1,
	}
end

return {
	app_name = app_name,
	timestamp_format = "%Y%m%d-%H%M%S",
	repo = repo,
	base = base,
	release = get_config("release"),
	testing = get_config("testing"),
}
