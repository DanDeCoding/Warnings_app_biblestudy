const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const filePath = './warningsData.json'; // The file where warnings will be saved

// In-memory structure to hold warnings
let warningsList = {};

// Read existing warnings data from the file at startup
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err && err.code === 'ENOENT') {
    // If the file does not exist, initialize the warningsList as empty and create the file
    console.log('No existing file found. Creating new file for warnings data.');
    fs.writeFile(filePath, JSON.stringify(warningsList), (writeErr) => {
      if (writeErr) {
        console.error('Error creating new file for warnings data:', writeErr);
      }
    });
  } else if (err) {
    console.error('An error occurred reading the warnings data file:', err);
  } else {
    try {
      warningsList = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing JSON from warnings data file:', parseErr);
    }
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

io.on('connection', (socket) => {
  console.log('A user connected');

  // When a client sends an 'add-warning' event
  socket.on('add-warning', (data) => {
    const warningKey = `${data.childName.toLowerCase()}|${data.yearGroup}`;
    if (!warningsList[warningKey]) {
      warningsList[warningKey] = {
        name: data.childName,
        yearGroup: data.yearGroup,
        warnings: [data.warning],
        outUntil: null
      };
    } else {
      warningsList[warningKey].warnings.push(data.warning);
      // Check for 3 strikes and mark as out for 2 weeks
      if (warningsList[warningKey].warnings.length >= 3 && !warningsList[warningKey].outUntil) {
        const outDate = new Date();
        outDate.setDate(outDate.getDate() + 14); // Set out for 2 weeks
        warningsList[warningKey].outUntil = outDate.toISOString();
      }
    }
    // Emit the updated warnings list to all clients
    io.emit('warnings-updated', warningsList);

    // After updating the warningsList object, write it to the file
    fs.writeFile(filePath, JSON.stringify(warningsList, null, 2), (err) => {
      if (err) {
        console.error('Error writing to warnings data file:', err);
      }
    });
    
  });

  // ... Rest of the code will follow in the next part ...
  // When a client sends a 'reset-warning' event
  socket.on('reset-warning', (data) => {
    const warningKey = `${data.childName.toLowerCase()}|${data.yearGroup}`;
    if (warningsList[warningKey]) {
      delete warningsList[warningKey];
      console.log(`Warnings reset for ${data.childName}`); // Log to the console
      // Emit the updated warnings list to all clients
      io.emit('warnings-updated', warningsList);
      // After updating the warningsList object, write it to the file
      fs.writeFile(filePath, JSON.stringify(warningsList, null, 2), (err) => {
        if (err) {
          console.error('Error writing to warnings data file:', err);
        }
      });      
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the HTTP server on port 3000
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
