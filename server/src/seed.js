import fs from 'fs';
import path from 'path';
import { db } from './db/db.js';
import { CONFIG } from './config/index.js';
import { hashPassword, hashEmail } from './utils/crypto.js';

export async function seedDatabase() {
  try {
    const existingUsers = db.find('users');
    if (existingUsers.length > 0) {
      console.log('[Seed] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[Seed] Fresh database detected. Seeding realistic academic data...');

    // 1. Create sample files in uploads directory
    const sampleFiles = [
      {
        filename: 'sample-react-lab-manual.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (BRALB507 React and Node.js Lab Manual) /Author (Prof. Prathyusha R) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
        name: 'BRALB507_React_Node_Lab_Manual.pdf'
      },
      {
        filename: 'sample-ai-minimax-assignment.pdf',
        content: '%PDF-1.4\n1 0 obj\n<< /Title (BAINB501 AI Minimax & Alpha-Beta Pruning Problem Statement) /Author (Prof. Preetha M) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF',
        name: 'BAINB501_Minimax_Pruning_Assignment.pdf'
      },
      {
        filename: 'sample-cns-packet-tracer.pkt',
        content: 'Packet Tracer Network Topology: Subnetting & OSPF Configuration Lab 4',
        name: 'BCNSB502_Lab4_Topology.pkt'
      }
    ];

    for (const f of sampleFiles) {
      const fullPath = path.join(CONFIG.UPLOAD_DIR, f.filename);
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, f.content, 'utf-8');
      }
    }

    // 2. Seed Users
    const defaultPassword = await hashPassword('password123');

    const neel = db.insertOne('users', {
      username: 'neel_dev',
      passwordHash: defaultPassword,
      fullName: 'Neel Kumar Gupta',
      department: 'Computer Science and Engineering',
      semester: 'V',
      section: 'C',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      emailHash: hashEmail('neelkumar.gupta@atria.edu'),
      bio: '5th Sem CSE student @ Atria. Building React & Node apps.'
    });

    const sarah = db.insertOne('users', {
      username: 'sarah_admin',
      passwordHash: defaultPassword,
      fullName: 'Sarah Jenkins',
      department: 'Computer Science and Engineering',
      semester: 'V',
      section: 'C',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      emailHash: hashEmail('sarah.jenkins@atria.edu'),
      bio: 'Class Representative & Study Group Coordinator'
    });

    const alex = db.insertOne('users', {
      username: 'alex_student',
      passwordHash: defaultPassword,
      fullName: 'Alex Rivera',
      department: 'Computer Science and Engineering',
      semester: 'V',
      section: 'C',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      emailHash: hashEmail('alex.rivera@atria.edu'),
      bio: 'Passionate about Computer Networks & Cybersecurity'
    });

    const prof = db.insertOne('users', {
      username: 'prof_prathyusha',
      passwordHash: defaultPassword,
      fullName: 'Prof. Prathyusha R',
      department: 'Computer Science and Engineering',
      semester: 'Faculty',
      section: 'CSE',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      emailHash: hashEmail('prathyusha.r@atria.edu'),
      bio: 'Assistant Professor, Department of CSE. Handling React and Node JS Lab (BRALB507).'
    });

    // 3. Seed Groups
    const group1 = db.insertOne('groups', {
      name: 'CSE 5th Sem - Section C (Official)',
      description: 'Official academic collaboration hub for 5th Semester Computer Science students, Section C. Share lecture slides, timetable alerts, and CIE schedules.',
      category: 'Academic',
      isPrivate: false,
      accessCode: null,
      creatorId: sarah._id,
      iconBg: 'from-indigo-500 to-purple-600'
    });

    const group2 = db.insertOne('groups', {
      name: 'React and Node JS Lab (BRALB507)',
      description: 'Official group for React and Node.js laboratory exercises, weekly experiment manuals, and project discussions.',
      category: 'Laboratory',
      isPrivate: false,
      accessCode: null,
      creatorId: prof._id,
      iconBg: 'from-cyan-500 to-blue-600'
    });

    const group3 = db.insertOne('groups', {
      name: 'Intelligent Data Analytics (BIDAB503)',
      description: 'Study circle for Machine Learning, data mining models, pandas & numpy implementations with Dr. Devi Kannan.',
      category: 'Study Group',
      isPrivate: false,
      accessCode: null,
      creatorId: neel._id,
      iconBg: 'from-amber-500 to-orange-600'
    });

    const group4 = db.insertOne('groups', {
      name: 'Atria Hackathon & Web Builders',
      description: 'Private project team preparing for upcoming inter-college hackathons and building campus utilities.',
      category: 'Club',
      isPrivate: true,
      accessCode: 'HACK26',
      creatorId: neel._id,
      iconBg: 'from-emerald-500 to-teal-600'
    });

    // 4. Seed Memberships
    // Neel in all groups
    db.insertOne('memberships', { groupId: group1._id, userId: neel._id, role: 'member', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group2._id, userId: neel._id, role: 'member', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group3._id, userId: neel._id, role: 'admin', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group4._id, userId: neel._id, role: 'admin', joinedAt: new Date().toISOString() });

    // Sarah
    db.insertOne('memberships', { groupId: group1._id, userId: sarah._id, role: 'admin', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group2._id, userId: sarah._id, role: 'member', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group3._id, userId: sarah._id, role: 'member', joinedAt: new Date().toISOString() });

    // Alex
    db.insertOne('memberships', { groupId: group1._id, userId: alex._id, role: 'member', joinedAt: new Date().toISOString() });
    db.insertOne('memberships', { groupId: group2._id, userId: alex._id, role: 'member', joinedAt: new Date().toISOString() });

    // Prof
    db.insertOne('memberships', { groupId: group2._id, userId: prof._id, role: 'admin', joinedAt: new Date().toISOString() });

    // 5. Seed Announcements
    db.insertOne('announcements', {
      groupId: group1._id,
      createdBy: sarah._id,
      title: '📢 CIE-2 Schedule Announced by Examination Cell',
      content: 'CIE-2 will commence from next Monday (Dec 1). Theory papers will be 50 marks each. Be sure to check the timetable and clear any attendance shortages with respective faculty.',
      priority: 'Urgent',
      isPinned: true
    });

    db.insertOne('announcements', {
      groupId: group2._id,
      createdBy: prof._id,
      title: '🧪 React Lab Project & Viva Guidelines',
      content: 'All batches (B1, B2, B3) must have their full-stack React project working with API endpoints and responsive UI ready for review by next lab session. Review rubric has been uploaded.',
      priority: 'Important',
      isPinned: true
    });

    // 6. Seed Assignments
    db.insertOne('assignments', {
      groupId: group2._id,
      uploadedBy: prof._id,
      title: 'React & Node.js Complete Lab Manual (Ex 1 to 10)',
      subject: 'React and Node JS Lab',
      description: 'Comprehensive lab manual covering components, props, state, hooks, Express API routes, JWT authentication, and Socket.IO integration.',
      facultyName: 'Prof. Prathyusha R',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'BRALB507_React_Node_Lab_Manual.pdf',
      storedFileName: 'sample-react-lab-manual.pdf',
      fileSize: 45020,
      fileType: 'application/pdf',
      downloadCount: 38
    });

    db.insertOne('assignments', {
      groupId: group1._id,
      uploadedBy: sarah._id,
      title: 'Minimax & Alpha-Beta Pruning Implementation Problem Set',
      subject: 'Artificial Intelligence Concepts (BAINB501)',
      description: 'Solve the game tree search questions and implement the heuristic evaluation function for Tic-Tac-Toe in Python.',
      facultyName: 'Prof. Preetha M',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'BAINB501_Minimax_Pruning_Assignment.pdf',
      storedFileName: 'sample-ai-minimax-assignment.pdf',
      fileSize: 32400,
      fileType: 'application/pdf',
      downloadCount: 24
    });

    db.insertOne('assignments', {
      groupId: group1._id,
      uploadedBy: alex._id,
      title: 'Packet Tracer VLAN & OSPF Routing Topology File',
      subject: 'Computer Networks & Security (BCNSB502)',
      description: 'Pre-configured Packet Tracer file with router configs and access control lists for Lab 4 practice.',
      facultyName: 'Ms. Shammi L',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fileName: 'BCNSB502_Lab4_Topology.pkt',
      storedFileName: 'sample-cns-packet-tracer.pkt',
      fileSize: 18200,
      fileType: 'application/octet-stream',
      downloadCount: 19
    });

    // 7. Seed Messages
    db.insertOne('messages', {
      groupId: group2._id,
      senderId: prof._id,
      content: 'Welcome everyone! In this group we will coordinate React experiments and clarify code issues.',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    });

    db.insertOne('messages', {
      groupId: group2._id,
      senderId: neel._id,
      content: 'Thank you Ma\'am! The lab manual download is working great. Excited to build the semester project.',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
    });

    db.insertOne('messages', {
      groupId: group2._id,
      senderId: alex._id,
      content: 'Are we allowed to use Tailwind CSS for the frontend UI styling?',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    });

    db.insertOne('messages', {
      groupId: group2._id,
      senderId: prof._id,
      content: 'Yes! Modern styling libraries like Tailwind CSS or component libraries are highly encouraged.',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
    });

    // 8. Seed Anonymous Confessions (Privacy Guaranteed - No user ID saved!)
    db.insertOne('confessions', {
      tag: 'Anon #7482',
      content: 'Still haven\'t started preparing for the IDA CIE-2 and the exam is in 4 days... Send help 💀',
      reactions: { '❤️': 4, '😂': 29, '💀': 42, '🫂': 11, '🎯': 2 },
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    });

    db.insertOne('confessions', {
      tag: 'Anon #3195',
      content: 'Shoutout to the library 3rd floor AC and quiet corner, it\'s the only thing keeping my sanity intact this semester ❤️',
      reactions: { '❤️': 38, '😂': 3, '💀': 1, '🫂': 14, '🎯': 7 },
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
    });

    db.insertOne('confessions', {
      tag: 'Anon #9042',
      content: 'Whoever keeps booking Lab Room 326 right when our batch has React Lab scheduled, please stop 😭',
      reactions: { '❤️': 6, '😂': 44, '💀': 12, '🫂': 8, '🎯': 3 },
      createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
    });

    console.log('[Seed] Database successfully populated with realistic student & academic records!');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
  }
}
