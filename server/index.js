const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const mediasoup = require('mediasoup');
const config = require('./config');

let worker;
let router;
// Map to store Transports: { socketId: { producer: Transport, consumer: Transport } }
const transports = {}; 
// Array to store Producers: [{ id, socketId }]
let producers = [];
// Map to store Consumers: { socketId: [Consumer] }
let consumers = {};

async function startMediasoup() {
  worker = await mediasoup.createWorker(config.mediasoup.worker);
  router = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
  console.log('Mediasoup Worker & Router started');
}

startMediasoup();

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize storage for this peer
  transports[socket.id] = { producer: null, consumer: null };
  consumers[socket.id] = [];
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find all producers associated with this socket
    const producersToRemove = producers.filter(p => p.socketId === socket.id);
    
    // Notify everyone else that these producers are gone
    producersToRemove.forEach(p => {
      socket.broadcast.emit('producerClosed', { producerId: p.id });
    });

    // Cleanup arrays
    producers = producers.filter(p => p.socketId !== socket.id);
    consumers[socket.id] = [];
    delete transports[socket.id];
  });

  socket.on('getRouterRtpCapabilities', (callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    try {
      const transport = await router.createWebRtcTransport(config.mediasoup.webRtcTransport);
      
      // Store transport specifically for this socket
      if (sender) transports[socket.id].producer = transport;
      else transports[socket.id].consumer = transport;

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        }
      });
    } catch (error) {
      console.error(error);
      callback({ error: error.message });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }) => {
    const transport = (transports[socket.id].producer && transports[socket.id].producer.id === transportId) 
      ? transports[socket.id].producer 
      : transports[socket.id].consumer;
      
    await transport.connect({ dtlsParameters });
  });

  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    const transport = transports[socket.id].producer;
    const producer = await transport.produce({ kind, rtpParameters });
    
    // Add to our list of producers
    producers.push({ id: producer.id, socketId: socket.id });

    producer.on('transportclose', () => {
      console.log('producer transport closed');
      producer.close();
      producers = producers.filter(p => p.id !== producer.id);
    });

    callback({ id: producer.id });
    
    // Tell EVERYONE else that a new producer is here
    socket.broadcast.emit('newProducer', { producerId: producer.id });
  });

  // NEW: Allow client to get existing producers
  socket.on('getProducers', (callback) => {
    // Return all producer IDs except the one belonging to the requester
    const otherProducers = producers.filter(p => p.socketId !== socket.id).map(p => p.id);
    callback(otherProducers);
  });

  socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
    if (router.canConsume({ producerId, rtpCapabilities })) {
      const transport = transports[socket.id].consumer;
      
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });

      consumers[socket.id].push(consumer);

      callback({
        params: {
          id: consumer.id,
          producerId: producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        }
      });
      
      await consumer.resume();
    }
  });
});

server.listen(3016, () => {
  console.log('Server listening on port 3016');
});