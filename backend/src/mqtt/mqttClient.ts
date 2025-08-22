import mqtt from 'mqtt'
import Jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from "../db/prismaclient";
dotenv.config();
const brokerUrl = "mqtt://localhost:1884";
const id = "backenduser";
const email = "backenduser@gmail.com"
const name = "backenduser";
const token = Jwt.sign({id:id,email:email,sub:name},process.env.JWT_SECRET!,{expiresIn:'2d'});
const options = {

 username: name,
  password: token,
};


const client = mqtt.connect(brokerUrl,options);

client.on('connect',()=>{
    console.log("Mqtt Connencted")
    client.subscribe("#", (err) => {
    if (!err) {
      console.log("Subscribed to all topics");
    } else {
      console.error("Subscribe error:", err);
    }
  });
})
client.on("message",async (topic, message) => {
  try{
  console.log(`Received message on ${topic}: ${message.toString()}`);
  const messageString = message.toString();
  const parts = topic.split('/');
  if(parts.length > 3){
    return;
  }
  const senderId = parts[2];
  const receiverId = parts[1];
  const msgObj = JSON.parse(messageString);
  const createdAt = msgObj.createdAt;
  await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: msgObj.content,
        createdAt: new Date(createdAt),
      },
    });

    console.log(`✅ Saved message from ${senderId} to ${receiverId}`);
}catch(error:any){
  console.log('An occur on saving message',error);
}
  
});
client.on('error',(error)=>{
    console.log('Mqtt not connected',error)
})

export default client;