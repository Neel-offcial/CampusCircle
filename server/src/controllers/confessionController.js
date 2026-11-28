import { db } from '../db/db.js';
import { generateAnonymousTag } from '../utils/crypto.js';

export async function getConfessions(req, res) {
  try {
    const filter = req.query.filter || 'recent'; // 'recent', 'top', 'popular'
    const userId = req.user?._id || req.user?.id || req.user?.username || 'anonymous_user';
    let confessions = db.find('confessions');

    if (filter === 'top') {
      confessions.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (filter === 'popular') {
      confessions.sort((a, b) => {
        const totalA = Object.values(a.reactions || {}).reduce((s, c) => s + c, 0);
        const totalB = Object.values(b.reactions || {}).reduce((s, c) => s + c, 0);
        return totalB - totalA;
      });
    } else {
      confessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const enriched = confessions.map(c => ({
      ...c,
      userVote: c.voters?.[userId] || 0,
      userVotedOption: c.poll?.voters?.[userId] || null
    }));

    res.json({ confessions: enriched });
  } catch (err) {
    console.error('[Confessions] Get error:', err);
    res.status(500).json({ message: 'Failed to load confessions.' });
  }
}

export async function createConfession(req, res) {
  try {
    const { content, poll } = req.body;
    let parsedPoll = null;

    if (poll) {
      try {
        parsedPoll = typeof poll === 'string' ? JSON.parse(poll) : poll;
      } catch (e) {
        parsedPoll = null;
      }
    }

    if ((!content || !content.trim()) && !req.file && !parsedPoll) {
      return res.status(400).json({ message: 'Confession text, photo, or poll is required.' });
    }

    // PRIVACY ENFORCEMENT:
    // Strips req.user._id, ip, or author data completely.
    const tag = generateAnonymousTag();
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    let formattedPoll = null;
    if (parsedPoll && parsedPoll.question && Array.isArray(parsedPoll.options)) {
      formattedPoll = {
        question: parsedPoll.question.trim(),
        totalVotes: 0,
        options: parsedPoll.options.filter(o => o.trim()).map((optText, index) => ({
          id: index + 1,
          text: optText.trim(),
          votes: 0
        }))
      };
    }

    const confession = db.insertOne('confessions', {
      tag,
      content: content ? content.trim() : '',
      imageUrl,
      poll: formattedPoll,
      upvotes: 0,
      downvotes: 0,
      score: 0,
      reactions: {
        '❤️': 0,
        '😂': 0,
        '💀': 0,
        '🫂': 0,
        '🎯': 0
      }
    });

    res.status(201).json({
      message: 'Anonymous confession posted!',
      confession,
      privacyGuarantee: 'Zero trace: no user ID or author reference recorded in database.'
    });
  } catch (err) {
    console.error('[Confessions] Create error:', err);
    res.status(500).json({ message: 'Failed to submit confession.' });
  }
}

export async function voteConfession(req, res) {
  try {
    const { confessionId } = req.params;
    const { direction } = req.body; // 1 for upvote, -1 for downvote
    const userId = req.user?._id || req.user?.id || req.user?.username || 'anonymous_user';

    const confession = db.findById('confessions', confessionId);
    if (!confession) return res.status(404).json({ message: 'Confession not found.' });

    let voters = { ...(confession.voters || {}) };
    let upvotes = confession.upvotes || 0;
    let downvotes = confession.downvotes || 0;

    const previousVote = voters[userId]; // undefined, 1, or -1

    if (previousVote === direction) {
      // Toggle off / remove vote if clicking the same action again
      if (direction === 1) upvotes = Math.max(0, upvotes - 1);
      if (direction === -1) downvotes = Math.max(0, downvotes - 1);
      delete voters[userId];
    } else {
      // If changing vote from up to down or vice-versa, cancel previous vote
      if (previousVote === 1) upvotes = Math.max(0, upvotes - 1);
      if (previousVote === -1) downvotes = Math.max(0, downvotes - 1);

      // Apply new vote
      if (direction === 1) upvotes += 1;
      if (direction === -1) downvotes += 1;
      voters[userId] = direction;
    }

    const score = upvotes - downvotes;

    const updated = db.updateById('confessions', confessionId, {
      upvotes,
      downvotes,
      score,
      voters
    });

    res.json({
      score: updated.score,
      upvotes: updated.upvotes,
      downvotes: updated.downvotes,
      userVote: voters[userId] || 0
    });
  } catch (err) {
    console.error('[Confessions] Vote error:', err);
    res.status(500).json({ message: 'Failed to vote.' });
  }
}

export async function votePoll(req, res) {
  try {
    const { confessionId } = req.params;
    const { optionId } = req.body;
    const userId = req.user?._id || req.user?.id || req.user?.username || 'anonymous_user';

    const confession = db.findById('confessions', confessionId);
    if (!confession || !confession.poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    let voters = { ...(confession.poll.voters || {}) };
    const previousOptionId = voters[userId];

    if (previousOptionId === optionId) {
      return res.json({ poll: confession.poll, alreadyVoted: true });
    }

    const options = confession.poll.options.map(opt => {
      let v = opt.votes || 0;
      if (opt.id === previousOptionId) v = Math.max(0, v - 1);
      if (opt.id === optionId) v += 1;
      return { ...opt, votes: v };
    });

    voters[userId] = optionId;
    const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

    const updated = db.updateById('confessions', confessionId, {
      poll: {
        ...confession.poll,
        totalVotes,
        options,
        voters
      }
    });

    res.json({
      poll: updated.poll,
      userVotedOption: optionId
    });
  } catch (err) {
    console.error('[Confessions] Poll vote error:', err);
    res.status(500).json({ message: 'Failed to vote on poll.' });
  }
}

export async function reactConfession(req, res) {
  try {
    const { confessionId } = req.params;
    const { emoji } = req.body;

    const allowedEmojis = ['❤️', '😂', '💀', '🫂', '🎯'];
    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({ message: 'Invalid emoji reaction.' });
    }

    const confession = db.findById('confessions', confessionId);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found.' });
    }

    const currentReactions = confession.reactions || {};
    const updatedCount = (currentReactions[emoji] || 0) + 1;

    const updated = db.updateById('confessions', confessionId, {
      reactions: {
        ...currentReactions,
        [emoji]: updatedCount
      }
    });

    res.json({
      message: 'Reaction recorded!',
      reactions: updated.reactions
    });
  } catch (err) {
    console.error('[Confessions] React error:', err);
    res.status(500).json({ message: 'Failed to react.' });
  }
}
