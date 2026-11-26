import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getListings(req, res) {
  try {
    const { category, search, sort } = req.query;
    let listings = db.find('marketplaceListings');

    if (category && category !== 'all') {
      listings = listings.filter(l => l.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (sort === 'price_asc') {
      listings.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price_desc') {
      listings.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ listings });
  } catch (err) {
    console.error('[Marketplace] Get listings error:', err);
    res.status(500).json({ message: 'Failed to load marketplace listings.' });
  }
}

export async function getListingById(req, res) {
  try {
    const { id } = req.params;
    const listing = db.findById('marketplaceListings', id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ listing });
  } catch (err) {
    console.error('[Marketplace] Get listing error:', err);
    res.status(500).json({ message: 'Failed to fetch listing.' });
  }
}

export async function createListing(req, res) {
  try {
    const { title, description, category, price, priceType, deliveryTime, tags, sellerAlias, previewCode } = req.body;
    const file = req.file;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Listing title is required.' });
    }

    let imageUrl = null;
    if (file) {
      imageUrl = `/uploads/${file.filename}`;
    }

    let parsedTags = ['Atria Verified'];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const alias = sellerAlias && sellerAlias.trim() ? sellerAlias.trim() : `Anon Seller #${Math.floor(1000 + Math.random() * 9000)}`;

    const listing = db.insertOne('marketplaceListings', {
      sellerId: req.user._id,
      sellerAlias: alias,
      sellerRating: 4.9,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Projects',
      price: price !== undefined && price !== '' ? Number(price) : 0,
      priceType: priceType || 'fixed', // 'fixed', 'negotiable', 'quote', 'free'
      deliveryTime: deliveryTime || '⚡ Within 24-48 Hours',
      imageUrl,
      previewCode: previewCode ? previewCode.trim() : null,
      tags: parsedTags,
      viewsCount: 0,
      inquiriesCount: 0,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Academic gig / listing published successfully!', listing });
  } catch (err) {
    console.error('[Marketplace] Create listing error:', err);
    res.status(500).json({ message: 'Failed to publish listing.' });
  }
}

// -------------------------------------------------------------
// BLIND ANONYMOUS INQUIRY CHAT (Buyer <-> Seller Relay)
// -------------------------------------------------------------
export async function startInquiry(req, res) {
  try {
    const { listingId } = req.params;
    const initialMessage = req.body.initialMessage || req.body.message;

    const listing = db.findById('marketplaceListings', listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    // Check if conversation already exists between this buyer and listing
    let convo = db.findOne('marketplaceConversations', {
      listingId,
      buyerId: req.user._id
    });

    if (!convo) {
      const buyerAlias = `Buyer #${Math.floor(100 + Math.random() * 900)}`;

      convo = db.insertOne('marketplaceConversations', {
        listingId,
        listingTitle: listing.title,
        listingCategory: listing.category,
        listingPrice: listing.price,
        buyerId: req.user._id,
        buyerAlias,
        sellerId: listing.sellerId,
        sellerAlias: listing.sellerAlias,
        messages: [],
        lastMessage: initialMessage || 'Started anonymous inquiry',
        lastMessageAt: new Date().toISOString()
      });

      // Increment inquiry count on listing
      db.updateById('marketplaceListings', listingId, {
        inquiriesCount: (listing.inquiriesCount || 0) + 1
      });
    }

    if (initialMessage && initialMessage.trim()) {
      const msg = {
        id: `msg_${Date.now()}`,
        senderId: req.user._id,
        senderAlias: req.user._id === convo.sellerId ? convo.sellerAlias : convo.buyerAlias,
        content: initialMessage.trim(),
        timestamp: new Date().toISOString()
      };

      const messages = [...(convo.messages || []), msg];
      convo = db.updateById('marketplaceConversations', convo._id, {
        messages,
        lastMessage: initialMessage.trim(),
        lastMessageAt: msg.timestamp
      });
    }

    res.status(201).json({ conversation: convo });
  } catch (err) {
    console.error('[Marketplace] Start inquiry error:', err);
    res.status(500).json({ message: 'Failed to start inquiry.' });
  }
}

export async function getConversations(req, res) {
  try {
    const all = db.find('marketplaceConversations');
    const myConvos = all.filter(c => c.buyerId === req.user._id || c.sellerId === req.user._id);

    myConvos.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    // Map to safe masked view
    const safeConvos = myConvos.map(c => {
      const isSeller = c.sellerId === req.user._id;
      return {
        _id: c._id,
        listingId: c.listingId,
        listingTitle: c.listingTitle,
        listingCategory: c.listingCategory,
        listingPrice: c.listingPrice,
        myRole: isSeller ? 'seller' : 'buyer',
        myAlias: isSeller ? c.sellerAlias : c.buyerAlias,
        counterpartyAlias: isSeller ? c.buyerAlias : c.sellerAlias,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        messageCount: c.messages?.length || 0
      };
    });

    res.json({ conversations: safeConvos });
  } catch (err) {
    console.error('[Marketplace] Get convos error:', err);
    res.status(500).json({ message: 'Failed to load conversations.' });
  }
}

export async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const convo = db.findById('marketplaceConversations', conversationId);

    if (!convo || (convo.buyerId !== req.user._id && convo.sellerId !== req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this confidential relay.' });
    }

    const isSeller = convo.sellerId === req.user._id;

    res.json({
      conversationId: convo._id,
      listingId: convo.listingId,
      listingTitle: convo.listingTitle,
      listingPrice: convo.listingPrice,
      myRole: isSeller ? 'seller' : 'buyer',
      myAlias: isSeller ? convo.sellerAlias : convo.buyerAlias,
      counterpartyAlias: isSeller ? convo.buyerAlias : convo.sellerAlias,
      messages: convo.messages || []
    });
  } catch (err) {
    console.error('[Marketplace] Get convo messages error:', err);
    res.status(500).json({ message: 'Failed to load messages.' });
  }
}

export async function sendInquiryMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const content = req.body.content || req.body.text;
    const file = req.file;

    if (!content && !file) {
      return res.status(400).json({ message: 'Message content or file is required.' });
    }

    const convo = db.findById('marketplaceConversations', conversationId);
    if (!convo || (convo.buyerId !== req.user._id && convo.sellerId !== req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const isSeller = convo.sellerId === req.user._id;
    const senderAlias = isSeller ? convo.sellerAlias : convo.buyerAlias;

    let fileUrl = null;
    let fileName = null;
    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
    }

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: req.user._id,
      senderAlias,
      content: content ? content.trim() : '',
      fileUrl,
      fileName,
      timestamp: new Date().toISOString()
    };

    const messages = [...(convo.messages || []), newMsg];
    const updated = db.updateById('marketplaceConversations', conversationId, {
      messages,
      lastMessage: content ? content.trim() : `📎 ${fileName}`,
      lastMessageAt: newMsg.timestamp
    });

    res.status(201).json({ message: newMsg });
  } catch (err) {
    console.error('[Marketplace] Send message error:', err);
    res.status(500).json({ message: 'Failed to send message.' });
  }
}
