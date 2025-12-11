const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON
app.use(express.json());

/* Connect to MongoDB */
mongoose.connect('mongodb://localhost:27017/ellys', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  quantity: Number
});

const Product = mongoose.model('Product', productSchema);

/* API: Get all products */
app.get('/api/products', async (req, res) =&gt; {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/* API: Add new stock */
app.post('/api/products', async (req, res) =&gt; {
  const { name, category, price, quantity } = req.body;
  try {
    const newProduct = new Product({ name, category, price, quantity });
    await newProduct.save();

    // Emit real-time update
    io.emit('stockUpdated', newProduct);
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

/* Serve static files (your frontend) */
app.use(express.static(__dirname));

/* WebSocket connection */
io.on('connection', (socket) =&gt; {
  console.log('A user connected');
  socket.on('disconnect', () =&gt; {
    console.log('A user disconnected');
  });
});

/* Start server */
const PORT = 3000;
server.listen(PORT, () =&gt; {
  console.log(`Server listening on port ${PORT}`);
});
