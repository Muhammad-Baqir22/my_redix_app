import mqtt from 'mqtt';

const brokerUrl = 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl);

client.on('connect', ()=>{
    console.log("Broker Connected");
})
client.on('error', (err)=>{
    console.log("Error Occured");
})

export default client;