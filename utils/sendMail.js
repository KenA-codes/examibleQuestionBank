const nodeMailer = require('nodemailer');

const sendMail = async ( options )=>{``
  
    const transporter = await nodeMailer.createTransport({
        host: process.env.EMAIL_HOST,
        service: process.env.EMAIL_SERVICE,
        port: 465,

        secure: true, // true for port 465, false for other ports
        auth: {
          user: "obusco4lyfe@gmail.com",
          pass: "nugn xilt pwbv arse"
        },
        // tls: {
        //     rejectUnauthorized: false, // Bypass SSL verification
        //   }        
      });

      async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: `"Fred Foo 👻" <${process.env.APP.USERNAME}>`, // sender address
          to: options.email, // list of receivers
          subject: options.subject, // Subject line
          html: options.html, // html body
        });

        console.log("Message sent: %s", info.messageId);
      }


      const mailOption = {
        subject: options.subject, text:options.text, from:"obusco4lyfe@gmail.com", to: options.email, html:options.html
      };
      await transporter.sendMail(mailOption)

}
module.exports = sendMail;