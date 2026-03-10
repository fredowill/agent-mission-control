const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data/campaigns.json', 'utf8'));
const c2 = d.find(c => c.id === 'campaign-002');

// Gate 6
const active = c2.agents.filter(a => a.slot.startsWith('orchestrator-v') && a.slot !== 'orchestrator-v2.2' && a.status === 'active');
console.log('Gate 6:', active.length ? active.map(a => a.slot).join(', ') : 'all completed');

// Gate 8
const me = c2.agents.find(a => a.slot === 'orchestrator-v2.2');
console.log('Gate 8: delivered:' + me.delivered.length + ' missed:' + me.missed.length);

// Gate 9
const handoff = fs.readFileSync('coordinated-sprint/orchestrator-v2.2-handoff.md', 'utf8');
console.log('Gate 9:', handoff.includes('Items Still Not Done') ? 'section found' : 'MISSING');

// Gate 11
const activeAgents = c2.agents.filter(a => a.status === 'active' && !a.slot.startsWith('orchestrator'));
console.log('Gate 11:', activeAgents.length ? activeAgents.map(a => a.slot).join(', ') : 'none active');
