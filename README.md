# api_base


Generating VAPID keys
In order to generate a public/private VAPID key pair, we first need to install the web-push library globally:

npm install web-push -g
We can then generate a VAPID key pair with this command:

npm install web-push -g && web-push generate-vapid-keys --json
And here is a sample output of this command:


{"publicKey":"BIwiR0uzpJEUxcucsfmwOW0svoztNp65fhT4Bq2dM1-7Y9NOacTMuUpZ5EmPpQ-fhgX-X0sdQFn7zDrLjnnmMLs","privateKey":"XJz3yRTP07U2R_cXloXITyC2K9iY2DQRKYhCyh2WJV0"}


bcrypt solution:
npm uninstall bcrypt && npm i bcrypt