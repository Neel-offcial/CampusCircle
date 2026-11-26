import { db } from '../db/db.js';
import { generateAnonymousTag } from '../utils/crypto.js';

// Random Offcampuz-style pseudonymous persona handles
const PERSONA_NAMES = [
  'Crimson Owl', 'Onyx 17', 'Nova 42', 'Kite 21', 'Byte Runner',
  'Cyber Phoenix', 'Echo Falcon', 'Phantom 09', 'Neon Lynx', 'Solaris 88',
  'Veloce 07', 'Zenith Spark', 'Aura 99', 'Pixel Ranger', 'Shadow Fox'
];

export function getRandomPersona() {
  const name = PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${name} #${num}`;
}

// -------------------------------------------------------------
// CAMPUS PULSES (Stories / Blinks)
// -------------------------------------------------------------
export async function getPulses(req, res) {
  try {
    let pulses = db.find('pulses');
    // Sort recent first
    pulses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ pulses });
  } catch (err) {
    console.error('[Feed] Get pulses error:', err);
    res.status(500).json({ message: 'Failed to fetch campus pulses.' });
  }
}

export async function createPulse(req, res) {
  try {
    const { title, content, tag, alias, sticker } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Pulse content is required.' });
    }

    const persona = alias && alias.trim() ? alias.trim() : getRandomPersona();

    const pulse = db.insertOne('pulses', {
      creatorId: req.user._id,
      creatorAlias: persona,
      title: title ? title.trim() : '',
      content: content.trim(),
      tag: tag || 'Campus Vibe',
      sticker: sticker || '📍 Atria Campus',
      reactions: { '🔥': 0, '⚡': 0, '😂': 0, '👀': 0 },
      expiresIn: '24 hours',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Pulse posted to Campus Stories!', pulse });
  } catch (err) {
    console.error('[Feed] Create pulse error:', err);
    res.status(500).json({ message: 'Failed to post pulse.' });
  }
}

export async function reactPulse(req, res) {
  try {
    const { pulseId } = req.params;
    const { emoji } = req.body;

    const pulse = db.findById('pulses', pulseId);
    if (!pulse) return res.status(404).json({ message: 'Pulse not found.' });

    const current = pulse.reactions || {};
    const updated = {
      ...current,
      [emoji]: (current[emoji] || 0) + 1
    };

    const updatedPulse = db.updateById('pulses', pulseId, { reactions: updated });
    res.json({ reactions: updatedPulse.reactions });
  } catch (err) {
    console.error('[Feed] React pulse error:', err);
    res.status(500).json({ message: 'Failed to react to pulse.' });
  }
}

// -------------------------------------------------------------
// CAMPUS EVENTS & FESTS (Offcampuz Style)
// -------------------------------------------------------------
export async function getEvents(req, res) {
  try {
    const events = db.find('events');
    const rsvps = db.find('eventRsvps', { userId: req.user._id }) || [];
    const rsvpMap = new Map(rsvps.map(r => [r.eventId, r.status]));

    const enriched = events.map(evt => ({
      ...evt,
      userRsvp: rsvpMap.get(evt._id) || null // 'going', 'interested', or null
    }));

    res.json({ events: enriched });
  } catch (err) {
    console.error('[Feed] Get events error:', err);
    res.status(500).json({ message: 'Failed to load events.' });
  }
}

export async function rsvpEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // 'going', 'interested', or 'cancel'

    const event = db.findById('events', eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    let goingCount = event.goingCount || 0;
    let interestedCount = event.interestedCount || 0;

    const existing = db.findOne('eventRsvps', { eventId, userId: req.user._id });

    if (existing) {
      if (existing.status === 'going') goingCount = Math.max(0, goingCount - 1);
      if (existing.status === 'interested') interestedCount = Math.max(0, interestedCount - 1);

      if (status === 'cancel' || existing.status === status) {
        // Toggle off
        db.deleteById('eventRsvps', existing._id);
        const updated = db.updateById('events', eventId, { goingCount, interestedCount });
        return res.json({ eventId, userRsvp: null, goingCount: updated.goingCount, interestedCount: updated.interestedCount });
      } else {
        // Switch status
        if (status === 'going') goingCount += 1;
        if (status === 'interested') interestedCount += 1;
        db.updateById('eventRsvps', existing._id, { status });
      }
    } else {
      if (status === 'going') goingCount += 1;
      if (status === 'interested') interestedCount += 1;
      db.insertOne('eventRsvps', { eventId, userId: req.user._id, status });
    }

    const updated = db.updateById('events', eventId, { goingCount, interestedCount });
    res.json({ eventId, userRsvp: status, goingCount: updated.goingCount, interestedCount: updated.interestedCount });
  } catch (err) {
    console.error('[Feed] RSVP error:', err);
    res.status(500).json({ message: 'Failed to update RSVP.' });
  }
}

// -------------------------------------------------------------
// NEWSFEED POSTS & POLLS
// -------------------------------------------------------------
export async function getFeedPosts(req, res) {
  try {
    const category = req.query.category || 'all';
    let posts = db.find('feedPosts');

    if (category && category !== 'all') {
      posts = posts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    }

    // Sort by recent or trending
    if (req.query.sort === 'top') {
      posts.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ posts });
  } catch (err) {
    console.error('[Feed] Get posts error:', err);
    res.status(500).json({ message: 'Failed to load newsfeed posts.' });
  }
}

export async function createFeedPost(req, res) {
  try {
    const { title, content, category, alias, poll, tags } = req.body;
    const file = req.file;

    if (!content && !file && !poll) {
      return res.status(400).json({ message: 'Post content, photo, or poll is required.' });
    }

    const persona = alias && alias.trim() ? alias.trim() : getRandomPersona();

    let imageUrl = null;
    if (file) {
      imageUrl = `/uploads/${file.filename}`;
    }

    let parsedPoll = null;
    if (poll) {
      try {
        const p = typeof poll === 'string' ? JSON.parse(poll) : poll;
        if (p.question && Array.isArray(p.options) && p.options.length >= 2) {
          parsedPoll = {
            question: p.question.trim(),
            totalVotes: 0,
            options: p.options.filter(o => o.trim()).map((opt, i) => ({
              id: i + 1,
              text: opt.trim(),
              votes: 0
            }))
          };
        }
      } catch (e) {
        parsedPoll = null;
      }
    }

    let parsedTags = ['Atria CSE'];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const post = db.insertOne('feedPosts', {
      creatorAlias: persona,
      college: 'Atria Institute of Technology',
      department: req.user.department || 'Computer Science and Engineering',
      title: title ? title.trim() : '',
      content: content ? content.trim() : '',
      category: category || 'Campus Buzz',
      imageUrl,
      poll: parsedPoll,
      tags: parsedTags,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      commentCount: 0,
      comments: [],
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Post published to Campus Pulse!', post });
  } catch (err) {
    console.error('[Feed] Create post error:', err);
    res.status(500).json({ message: 'Failed to create feed post.' });
  }
}

export async function voteFeedPost(req, res) {
  try {
    const { postId } = req.params;
    const { direction } = req.body; // 1 or -1

    const post = db.findById('feedPosts', postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    let upvotes = post.upvotes || 0;
    let downvotes = post.downvotes || 0;

    if (direction === 1) upvotes += 1;
    if (direction === -1) downvotes += 1;

    const score = upvotes - downvotes;

    const updated = db.updateById('feedPosts', postId, { upvotes, downvotes, score });
    res.json({ postId, score: updated.score, upvotes: updated.upvotes, downvotes: updated.downvotes });
  } catch (err) {
    console.error('[Feed] Vote post error:', err);
    res.status(500).json({ message: 'Failed to vote on post.' });
  }
}

export async function voteFeedPoll(req, res) {
  try {
    const { postId } = req.params;
    const { optionId } = req.body;

    const post = db.findById('feedPosts', postId);
    if (!post || !post.poll) return res.status(404).json({ message: 'Poll not found.' });

    const options = post.poll.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
    const updatedPoll = { ...post.poll, totalVotes, options };

    db.updateById('feedPosts', postId, { poll: updatedPoll });
    res.json({ postId, poll: updatedPoll });
  } catch (err) {
    console.error('[Feed] Vote poll error:', err);
    res.status(500).json({ message: 'Failed to vote on poll.' });
  }
}

export async function commentFeedPost(req, res) {
  try {
    const { postId } = req.params;
    const { alias } = req.body;
    const text = req.body.text || req.body.content;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const post = db.findById('feedPosts', postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = {
      id: `c_${Date.now()}`,
      authorAlias: alias && alias.trim() ? alias.trim() : getRandomPersona(),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const comments = [...(post.comments || []), comment];
    const commentCount = comments.length;

    db.updateById('feedPosts', postId, { comments, commentCount });

    res.status(201).json({ comment, commentCount });
  } catch (err) {
    console.error('[Feed] Comment error:', err);
    res.status(500).json({ message: 'Failed to add comment.' });
  }
}
