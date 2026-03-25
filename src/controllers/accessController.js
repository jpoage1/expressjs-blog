/**
 * Handles the GET request from a recruiter clicking the unique link.
 */
exports.handleAccessConsumption = async (req, res, next) => {
  const { token } = req.params;

  try {
    res.renderWithBaseContext("pages/credentials.handlebars", {
      title: "Portfolio Access",
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.renderPortal = async (req, res, next) => {
  res.renderWithBaseContext("admin-pages/accessManager.handlebars", {
    title: "Access Management",
    // Base context handles user/session data
  });
};
