import mqtt from 'mqtt'
import dotenv from 'dotenv';
import prisma from "../db/prismaclient";
dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1884";
const options = {
  username: process.env.MQTT_USERNAME ?? "backenduser",
  password: process.env.MQTT_PASSWORD ?? "backenduser",
};

const client = mqtt.connect(brokerUrl, options);

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
  // Ignore backend-published real-time notifications (msg/ prefix)
  if(topic.startsWith('msg/')) return;
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