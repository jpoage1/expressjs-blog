local app_name = "deployment-pipeline"
local git_user = "example"

local repo = "ssh://git@github.com/" .. git_user .. "/" .. app_name .. ".git"
local config_dir = "/etc/" .. app_name
-- 1. Static Lookups
local base = "/var/lib/" .. app_name
local deployments = base .. "/deployments"

-- Pipeline testing
local config_file = "/etc/" .. app_name .. "/config.toml"

function get_config(env_key)
	-- Specific folder name for this environment
	local instance_name = app_name .. "-" .. env_key
	local deploy_link = deployments .. "/" .. instance_name

	return {
		deploy_link = deploy_link,
		-- Pipeline testing
		config_file = config_file,
		-- config_file = config_dir .. env_key .. ".toml",
		service_name = app_name .. "@" .. env_key .. ".service",
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
