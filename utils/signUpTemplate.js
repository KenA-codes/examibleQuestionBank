const signUpTemplate = (fullName, link) => {
    return `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <div style="width: 100%; background-color: #f2f2f2;">
        <div style="margin: 0 auto; max-width: 600px; background-color: #ffffff;">
            <div style="background-color: #4CAF50; padding: 10px 0; text-align: center;">
                <h2 style="color: white;">AI Podcast</h2>
            </div>
            <div style="padding: 20px;">
                <h3>Hi ${fullName},</h3>
                <p>Thank you for signing up with AI Podcast. Please click the link below to verify your email address.</p>
                <a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a>
            </div>
        </div>
    </div>
</div>
    `;
  };

  module.exports = signUpTemplate;

