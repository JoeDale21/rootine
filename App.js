import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, Platform, StatusBar, Animated, Easing, Share,
  KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Ellipse, Rect, Circle, G, Defs, ClipPath, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================================================================
   ROOTINE — full React Native build
   ================================================================ */

/* ---------------------------- themes ------------------------------
   Two visual identities. 'herbarium' is the original quiet, papery
   look; 'bloom' is brighter, rounder and more playful. Switch in Set-up.
   ------------------------------------------------------------------ */

const THEMES = {
  herbarium: {
    label: 'Herbarium',
    blurb: 'Quiet, papery, understated.',
    c: { paper: '#DFE2DA', card: '#F2F3ED', ink: '#1C2620', muted: '#6B7368',
         rule: '#C7CBC0', bark: '#8A7A63', dead: '#D2D6CA', gold: '#C2973B',
         inputBg: '#FBFBF7', sky: '#D5E2DC' },
    d: { body: '#5C8A4A', mind: '#3F6480', people: '#B07A2B', money: '#4F8578' },
    s: { radius: 3, pill: 999, border: 1, cardShadow: 0, headingSerif: true,
         chipPadV: 7, chipPadH: 12, btnPadV: 11, tick: 40, day: 36, pop: 1.0 },
  },
  bloom: {
    label: 'Bloom',
    blurb: 'Brighter, rounder, more playful.',
    c: { paper: '#FBF6EC', card: '#FFFFFF', ink: '#23303A', muted: '#7B8794',
         rule: '#E4DDD1', bark: '#C08A5A', dead: '#EDE7DB', gold: '#F5A623',
         inputBg: '#FFFDF8', sky: '#DCEFF5' },
    d: { body: '#3DBA7A', mind: '#4C9BE8', people: '#FF8A5B', money: '#12B5A5' },
    s: { radius: 18, pill: 999, border: 1.5, cardShadow: 1, headingSerif: false,
         chipPadV: 9, chipPadH: 15, btnPadV: 14, tick: 46, day: 40, pop: 1.14 },
  },
};

let THEME_KEY = 'herbarium';
let T = Object.assign({}, THEMES.herbarium.c);
let S = Object.assign({}, THEMES.herbarium.s);
let SERIF = Platform.OS === 'ios' ? 'Palatino' : 'serif';
let SANS_BOLD = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';
let styles = null;   // built by applyTheme below

const DOMAINS = {
  body:   { code: 'BD', label: 'Body',   colour: THEMES.herbarium.d.body,   hint: 'Fitter, stronger, better rested' },
  mind:   { code: 'MN', label: 'Mind',   colour: THEMES.herbarium.d.mind,   hint: 'Calmer, clearer, more grounded' },
  people: { code: 'PE', label: 'People', colour: THEMES.herbarium.d.people, hint: 'Closer to the ones who matter' },
  money:  { code: 'MY', label: 'Money',  colour: THEMES.herbarium.d.money,  hint: 'Secure, in control, unstuck' },
};

// Heading font: serif in Herbarium, a chunky sans in Bloom.
const headFont = () => (S.headingSerif ? SERIF : SANS_BOLD);
const headWeight = () => (S.headingSerif ? '400' : '700');

function applyTheme(key) {
  const th = THEMES[key] || THEMES.herbarium;
  THEME_KEY = key;
  Object.assign(T, th.c);
  Object.assign(S, th.s);
  Object.keys(DOMAINS).forEach((k) => { DOMAINS[k].colour = th.d[k]; });
  styles = buildStyles();
}

const MOTIVES = [
  'Wellbeing', 'Confidence', 'Weight', 'Energy', 'Sleep', 'Focus',
  'Money', 'Work performance', 'A promotion', 'Study or learning',
  'People around me', 'Family', 'Health condition', 'Proving something to myself',
];

const PACES = {
  gentle: { key: 'gentle', label: 'Bite-sized', start: 0.34, step: 0.16, weeksPerStep: 2,
            blurb: 'Starts well below your target. Grows only after two solid weeks.' },
  steady: { key: 'steady', label: 'Steady', start: 0.5, step: 0.25, weeksPerStep: 1,
            blurb: 'Starts at half. Grows every week you hit the mark.' },
  bold:   { key: 'bold', label: 'Full pelt', start: 0.85, step: 0.5, weeksPerStep: 1,
            blurb: 'Close to your full target from day one.' },
};

const UNITS = ['minutes', 'hours', 'miles', 'km', 'steps', 'reps', 'sets', 'pages', 'glasses', '£'];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MATURITY = 60;
const STORAGE_KEY = 'rootine-rn-v2';

const QUOTES = [
  { t: 'Well-being is attained little by little, and nevertheless is no little thing itself.', a: 'Zeno' },
  { t: 'We suffer more often in imagination than in reality.', a: 'Seneca' },
  { t: 'First say to yourself what you would be; and then do what you have to do.', a: 'Epictetus' },
  { t: 'Waste no more time arguing about what a good man should be. Be one.', a: 'Marcus Aurelius' },
  { t: 'No man is free who is not master of himself.', a: 'Epictetus' },
  { t: 'You have power over your mind — not outside events. Realise this, and you will find strength.', a: 'Marcus Aurelius' },
];

const NUDGES = [
  "One small step today. That's the whole job.",
  'You said this was for {m}. Still true?',
  '"Well-being is attained little by little." — Zeno',
  'Your tree only grows when you tell it to. Thirty seconds to log.',
  "Didn't manage it? Log the honest week anyway — the branch keeps what you did do.",
  '"First say to yourself what you would be." — Epictetus',
  "Today's step is smaller than the version in your head. That's deliberate.",
  '"Confine yourself to the present." — Marcus Aurelius',
];

const JOURNAL_DAILY = [
  "What made today's step easy, or hard?",
  'What did you notice, in yourself or around you, while doing this?',
  'Write a sentence to the version of you who does this tomorrow.',
  "What almost stopped you today — and what didn't?",
];
const JOURNAL_WEEKLY = [
  'Looking back, what surprised you about this week?',
  "What's different now, however small, since you started this?",
  'What would make next week a little easier?',
  'Where did you show yourself something true this week?',
];

const REFLECTIONS = [
  { k: 'struggled', label: 'A struggle', emoji: '🌧' },
  { k: 'steady', label: 'Steady', emoji: '⛅' },
  { k: 'strong', label: 'Strong', emoji: '☀' },
];

const ENCOURAGEMENTS = [
  { k: 'leaf', glyph: '🌿', label: 'Well done', note: 'for hitting a milestone' },
  { k: 'root', glyph: '🪵', label: 'Solid', note: 'for sticking at it week after week' },
  { k: 'sun', glyph: '🌤', label: 'Kept going', note: 'for turning up on a hard week' },
  { k: 'seed', glyph: '🌱', label: 'Good start', note: 'for getting going' },
  { k: 'return', glyph: '↻', label: 'Welcome back', note: 'for picking something back up' },
];

/* ----------------------------- dates ----------------------------- */

const pad = (n) => String(n).padStart(2, '0');
const dk = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayIdx = (d) => (d.getDay() + 6) % 7;
function weekStart(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - dayIdx(x));
  return x;
}
const uid = () => Math.random().toString(36).slice(2, 9);
const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/* --------------------------- habit maths -------------------------- */

function countBetween(log, habitId, from, to) {
  let n = 0;
  for (let d = new Date(from); d < to; d = addDays(d, 1)) if (log[dk(d)] && log[dk(d)][habitId]) n++;
  return n;
}

const inPause = (pauses, from, to) =>
  (pauses || []).some((p) => p.from < to.getTime() && p.to > from.getTime());

function targetAt(habit, level, pace) {
  const full = habit.days.length || 1;
  const frac = Math.min(1, pace.start + level * pace.step);
  return {
    frac,
    times: Math.max(1, Math.min(full, Math.round(full * frac))),
    amount: habit.amount ? Math.max(1, Math.round(habit.amount * frac)) : null,
  };
}

function levelOf(habit, log, pace, pauses) {
  const maxLevel = Math.ceil((1 - pace.start) / pace.step);
  const now = weekStart(new Date());
  let w = weekStart(new Date(habit.createdAt));
  let level = 0, run = 0, guard = 0;
  while (w < now && level < maxLevel && guard++ < 250) {
    const end = addDays(w, 7);
    if (!inPause(pauses, w, end)) {
      const t = targetAt(habit, level, pace);
      if (countBetween(log, habit.id, w, end) >= t.times) {
        if (++run >= pace.weeksPerStep) { level++; run = 0; }
      } else run = 0;
    }
    w = end;
  }
  return Math.min(level, maxLevel);
}

function habitState(habit, log, pace, pauses) {
  const level = levelOf(habit, log, pace, pauses);
  const target = targetAt(habit, level, pace);
  const ws = weekStart(new Date());
  const done = countBetween(log, habit.id, ws, addDays(ws, 7));
  return { level, target, done, atFull: target.frac >= 1 };
}

function goalProgress(goal, log) {
  let total = 0;
  goal.habits.forEach((h) => {
    Object.keys(log).forEach((k) => { if (log[k][h.id]) total++; });
  });
  return { total, pct: Math.min(1, total / MATURITY) };
}

function streakOf(log) {
  const any = (d) => {
    const day = log[dk(d)];
    return day && Object.keys(day).some((k) => day[k]);
  };
  let d = new Date(); d.setHours(0, 0, 0, 0);
  if (!any(d)) d = addDays(d, -1);
  let n = 0;
  while (any(d) && n < 999) { n++; d = addDays(d, -1); }
  return n;
}

function longestStreak(log) {
  const days = Object.keys(log).filter((k) => Object.keys(log[k]).some((h) => log[k][h])).sort();
  if (!days.length) return 0;
  let best = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]), cur = new Date(days[i]);
    run = addDays(prev, 1).toDateString() === cur.toDateString() ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

function weeklyCompletion(goals, log, weeks) {
  const live = goals.filter((g) => g.status !== 'done');
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(weekStart(new Date()), -7 * i);
    const we = addDays(ws, 7);
    let want = 0, got = 0;
    live.forEach((g) => {
      if (inPause(g.pauses, ws, we)) return;
      g.habits.forEach((h) => {
        if (h.createdAt > we.getTime()) return;
        want += h.days.length;
        got += Math.min(h.days.length, countBetween(log, h.id, ws, we));
      });
    });
    out.push({ label: ws.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
               pct: want ? Math.round((got / want) * 100) : null });
  }
  return out;
}

function nudgeFor(profile, date) {
  const raw = NUDGES[dayOfYear(date) % NUDGES.length];
  const m = ((profile.motives || [])[0] || 'the life you described').toLowerCase();
  return raw.replace('{m}', m);
}

const whyToList = (w) => (w || '').split('\n').map((s) => s.trim()).filter(Boolean);

function hasEntryBetween(entries, goalId, from, to) {
  return entries.some((e) => e.goalId === goalId && e.at >= from.getTime() && e.at < to.getTime());
}

function journalDue(goals, entries, date) {
  const today = new Date(dk(date)), ws = weekStart(date), we = addDays(ws, 7);
  const due = [];
  goals.filter((g) => g.status === 'active' || g.status === 'maintain').forEach((g) => {
    const pool = g.journal === 'weekly' ? JOURNAL_WEEKLY : JOURNAL_DAILY;
    const prompt = pool[(dayOfYear(date) + g.id.length) % pool.length];
    if (g.journal === 'daily' && !hasEntryBetween(entries, g.id, today, addDays(today, 1))) {
      due.push({ goal: g, cadence: 'daily', prompt });
    } else if (g.journal === 'weekly' && dayIdx(date) === 6 && !hasEntryBetween(entries, g.id, ws, we)) {
      due.push({ goal: g, cadence: 'weekly', prompt });
    }
  });
  return due;
}

function achievementChips(state) {
  const { goals, log } = state;
  const cur = streakOf(log), best = longestStreak(log);
  let total = 0;
  Object.keys(log).forEach((k) => { total += Object.keys(log[k]).filter((h) => log[k][h]).length; });
  const chips = [];
  if (cur >= 3) chips.push(`${cur}-day streak going`);
  if (best >= 7 && best !== cur) chips.push(`Longest streak: ${best} days`);
  goals.forEach((g) => {
    const p = goalProgress(g, log).pct;
    if (g.status === 'done') chips.push(`"${g.title}" made it to the canopy`);
    else if (p >= 0.5) chips.push(`"${g.title}" is ${Math.round(p * 100)}% grown`);
  });
  if (total >= 10) chips.push(`${total} steps recorded`);
  return chips.slice(0, 5);
}

/* ------------------------------ atoms ----------------------------- */

// The check-off circle. Pops outward the moment it's ticked.
function TickButton({ ticked, colour, onPress }) {
  const a = useRef(new Animated.Value(1)).current;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!ticked) return;
    Animated.sequence([
      Animated.timing(a, { toValue: S.pop + 0.1, duration: 130, useNativeDriver: true }),
      Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 16 }),
    ]).start();
  }, [ticked]);
  return (
    <Bouncy onPress={onPress}>
      <Animated.View style={[styles.tick, { transform: [{ scale: a }],
        borderColor: ticked ? colour : T.rule,
        backgroundColor: ticked ? colour : 'transparent' }]}>
        <Text style={{ color: ticked ? '#FFFFFF' : T.rule, fontSize: 19, fontWeight: '700' }}>✓</Text>
      </Animated.View>
    </Bouncy>
  );
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Eyebrow({ children, style }) {
  const up = (c) => typeof c === 'string' || typeof c === 'number'
    ? String(c).toUpperCase() : c;
  return (
    <Text style={[styles.eyebrow, style]}>
      {Array.isArray(children) ? children.map(up) : up(children)}
    </Text>
  );
}

// Squeeze-on-press wrapper. In Bloom the squeeze is deeper and springier.
function Bouncy({ children, onPress, disabled, style, depth }) {
  const a = useRef(new Animated.Value(1)).current;
  const to = depth || (S.cardShadow ? 0.92 : 0.97);
  const spring = (v, b) => Animated.spring(a, { toValue: v, useNativeDriver: true,
    speed: 45, bounciness: b }).start();
  return (
    <Animated.View style={[{ transform: [{ scale: a }] }, style]}>
      <TouchableOpacity activeOpacity={0.85} disabled={disabled}
        onPress={disabled ? null : onPress}
        onPressIn={() => !disabled && spring(to, 0)}
        onPressOut={() => !disabled && spring(1, S.cardShadow ? 14 : 4)}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function Button({ children, onPress, tone = 'solid', disabled, style }) {
  const toneStyle = tone === 'solid' ? styles.btnSolid : tone === 'quiet' ? styles.btnQuiet : styles.btnBare;
  const textStyle = tone === 'solid' ? styles.btnSolidText : tone === 'quiet' ? styles.btnQuietText : styles.btnBareText;
  return (
    <Bouncy onPress={onPress} disabled={disabled} style={style}>
      <View style={[styles.btn, toneStyle, disabled && { opacity: 0.45 }]}>
        <Text style={[textStyle, { textAlign: 'center' }]}>{children}</Text>
      </View>
    </Bouncy>
  );
}

function Chip({ active, children, onPress }) {
  return (
    <Bouncy onPress={onPress}>
      <View style={[styles.chip, active ? styles.chipOn : styles.chipOff]}>
        <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{children}</Text>
      </View>
    </Bouncy>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      {children}
    </View>
  );
}

function DayPicker({ days, onChange, colour = T.ink }) {
  const toggle = (i) => onChange(days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort((a, b) => a - b));
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {DAY_LETTERS.map((l, i) => {
        const on = days.includes(i);
        return (
          <Bouncy key={i} onPress={() => toggle(i)}>
            <View accessibilityLabel={DAY_NAMES[i]}
              style={[styles.dayCircle, { borderColor: on ? colour : T.rule,
                                          backgroundColor: on ? colour : 'transparent' }]}>
              <Text style={{ color: on ? '#FFFFFF' : T.muted, fontWeight: '700', fontSize: 13 }}>{l}</Text>
            </View>
          </Bouncy>
        );
      })}
    </View>
  );
}

function UnitPicker({ unit, onChange }) {
  const preset = UNITS.includes(unit);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 4 }}>
          {UNITS.map((u) => <Chip key={u} active={unit === u} onPress={() => onChange(u)}>{u}</Chip>)}
          <Chip active={!preset} onPress={() => onChange('')}>Something else…</Chip>
        </View>
      </ScrollView>
      {!preset && (
        <TextInput style={[styles.input, { marginTop: 8 }]} value={unit} onChangeText={onChange}
                   maxLength={16} placeholder="lengths, verses, calls…" placeholderTextColor={T.muted} />
      )}
    </View>
  );
}

function WhyList({ rows, setRows }) {
  return (
    <Field label="Why it matters">
      {rows.map((w, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <TextInput style={[styles.input, { flex: 1 }]} value={w}
            onChangeText={(v) => setRows(rows.map((x, k) => (k === i ? v : x)))}
            placeholder={i === 0 ? 'Your own words' : 'Why else?'} placeholderTextColor={T.muted} />
          {rows.length > 1 && (
            <TouchableOpacity onPress={() => setRows(rows.filter((_, k) => k !== i))}>
              <Text style={{ color: T.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {rows.length < 4 && rows[rows.length - 1].trim() !== '' && (
        <Button tone="bare" onPress={() => setRows([...rows, ''])}
                style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}>+ Add another reason</Button>
      )}
    </Field>
  );
}

function JournalPicker({ value, onChange }) {
  return (
    <Field label="Journal for this goal">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[['off', 'No journal'], ['daily', 'Daily'], ['weekly', 'Weekly']].map(([k, l]) => (
          <Chip key={k} active={(value || 'off') === k} onPress={() => onChange(k)}>{l}</Chip>
        ))}
      </View>
      <Text style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>
        An open prompt appears on Today when it's due. Entries go to your Journal, private to you.
      </Text>
    </Field>
  );
}

/* --------------------------- shoot anim --------------------------- */

function Shoot() {
  const grow = useRef(new Animated.Value(0)).current;
  const leafA = useRef(new Animated.Value(0)).current;
  const leafB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(grow, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(leafA, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(leafB, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const colour = DOMAINS.body.colour;
  return (
    <View style={{ height: 78, justifyContent: 'flex-end' }}>
      <Animated.View style={{ transform: [{ scaleY: grow }] }}>
        <Svg width={92} height={78} viewBox="0 0 120 100">
          <Path d="M60 92 C 60 66 58 48 58 26" stroke={colour} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, opacity: leafA, transform: [{ scale: leafA }] }}>
        <Svg width={92} height={78} viewBox="0 0 120 100">
          <Ellipse cx={42} cy={40} rx={15} ry={8.5} fill={colour} transform="rotate(-18 42 40)" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, opacity: leafB, transform: [{ scale: leafB }] }}>
        <Svg width={92} height={78} viewBox="0 0 120 100">
          <Ellipse cx={76} cy={32} rx={15} ry={8.5} fill={shade(colour, 22)} transform="rotate(16 76 32)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ------------------------------ tree ------------------------------ */

const qbez = (p0, c, p1, t) => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * p1.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * p1.y,
});

function branchGeom(i, n) {
  const side = i % 2 === 0 ? -1 : 1;
  const rows = Math.max(1, Math.ceil(n / 2));
  const row = Math.floor(i / 2);
  const t = rows === 1 ? 0.3 : row / (rows - 1);
  const baseY = 366 - t * 156;
  const len = 118 - t * 30;
  const p0 = { x: 200 + side * 7, y: baseY };
  const p1 = { x: 200 + side * len, y: baseY - 74 - t * 12 };
  const c = { x: 200 + side * len * 0.52, y: baseY - 4 };
  const clusters = [0.42, 0.62, 0.82, 0.97].map((at, k) => {
    const pt = qbez(p0, c, p1, 0.34 + 0.62 * (k / 3));
    const off = k % 2 === 0 ? 1 : -1;
    return { at, x: pt.x + off * 8, y: pt.y - 10, rot: side * 26 + off * 24 };
  });
  const twigs = [0.5, 0.78].map((tt, k) => {
    const pt = qbez(p0, c, p1, tt);
    const off = k % 2 === 0 ? -1 : 1;
    return { at: 0.3 + k * 0.35, x1: pt.x, y1: pt.y, x2: pt.x + off * 10 * side, y2: pt.y - 16 };
  });
  return { p0, c, p1, clusters, twigs, side, tip: p1 };
}

function partialPath(g, pct) {
  if (pct <= 0) return '';
  const steps = 26;
  const end = Math.max(1, Math.round(steps * pct));
  let d = '';
  for (let i = 0; i <= end; i++) {
    const pt = qbez(g.p0, g.c, g.p1, i / steps);
    d += (i === 0 ? 'M ' : ' L ') + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1);
  }
  return d;
}

function Tree({ goals, log }) {
  const shown = goals.slice(0, 8);
  const overall = shown.length
    ? shown.reduce((s, g) => s + goalProgress(g, log).pct, 0) / shown.length : 0;
  const grass = [46, 84, 118, 150, 262, 292, 326, 352, 190, 236].slice(0, 4 + Math.round(overall * 6));

  return (
    <Svg width="100%" height={350} viewBox="-60 0 520 448">
      <Defs>
        <ClipPath id="trunkClip">
          <Path d="M183 424 C 189 352 191 300 193 206 C 193 198 196 191 200 189 C 204 191 207 198 207 206 C 209 300 211 352 217 424 Z" />
        </ClipPath>
        <LinearGradient id="mound" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9D2BA" />
          <Stop offset="1" stopColor="#D8DCCB" />
        </LinearGradient>
      </Defs>

      <Circle cx={58} cy={58} r={26} fill="#E9DCA0" opacity={0.2 + overall * 0.4} />
      <Circle cx={58} cy={58} r={38} fill="#E9DCA0" opacity={0.08 + overall * 0.12} />
      {overall > 0.3 && (
        <G stroke={T.muted} strokeWidth={1.6} fill="none" opacity={0.7} strokeLinecap="round">
          <Path d="M296 84 q 6 -6 12 0 q 6 -6 12 0" />
          <Path d="M322 106 q 5 -5 10 0 q 5 -5 10 0" />
        </G>
      )}

      <Path d="M18 424 Q 200 396 382 424 L 382 448 L 18 448 Z" fill="url(#mound)" />
      <Ellipse cx={200} cy={424} rx={90} ry={7} fill={T.ink} opacity={0.07} />
      {grass.map((x, i) => (
        <Path key={x} d={`M ${x} ${420 - (x % 5)} q 2 -8 ${i % 2 ? 4 : -3} -11`}
              stroke={shade('#7B9459', (i % 3) * 14 - 10)} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ))}
      <Path d="M200 420 C 176 421 163 427 146 431" stroke={T.bark} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
      <Path d="M200 420 C 224 421 237 427 254 431" stroke={T.bark} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />

      <G clipPath="url(#trunkClip)">
        <Rect x={178} y={185} width={44} height={242} fill={T.dead} />
        <Rect x={178} y={427 - 242 * overall} width={44} height={242 * overall} fill={T.bark} />
      </G>

      {shown.map((g, i) => {
        const geom = branchGeom(i, shown.length);
        const { pct } = goalProgress(g, log);
        const done = g.status === 'done';
        const colour = done ? shade(DOMAINS[g.domain].colour, 34) : DOMAINS[g.domain].colour;
        const full = `M ${geom.p0.x} ${geom.p0.y} Q ${geom.c.x} ${geom.c.y} ${geom.p1.x} ${geom.p1.y}`;
        return (
          <G key={g.id} opacity={g.status === 'paused' ? 0.35 : done ? 0.6 : 1}>
            <Path d={full} stroke={T.dead} strokeWidth={9} fill="none" strokeLinecap="round" />
            {pct > 0 && (
              <Path d={partialPath(geom, pct)} stroke={colour} strokeWidth={9} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
            )}
            {geom.twigs.map((tw, k) => (
              <Line key={k} x1={tw.x1} y1={tw.y1} x2={tw.x2} y2={tw.y2}
                    stroke={pct >= tw.at ? colour : T.dead} strokeWidth={3.4} strokeLinecap="round" />
            ))}
            {geom.clusters.map((cl, k) => (pct >= cl.at ? (
              <G key={k}>
                <Ellipse cx={cl.x - 5} cy={cl.y + 3} rx={8.5} ry={5} fill={shade(colour, -22)}
                         transform={`rotate(${cl.rot - 18} ${cl.x - 5} ${cl.y + 3})`} opacity={0.9} />
                <Ellipse cx={cl.x + 5} cy={cl.y + 2} rx={8.5} ry={5} fill={shade(colour, 26)}
                         transform={`rotate(${cl.rot + 20} ${cl.x + 5} ${cl.y + 2})`} opacity={0.9} />
                <Ellipse cx={cl.x} cy={cl.y - 2} rx={9.5} ry={5.5} fill={colour}
                         transform={`rotate(${cl.rot} ${cl.x} ${cl.y})`} />
              </G>
            ) : null))}
            {pct >= 0.999 && (
              <Circle cx={geom.tip.x} cy={geom.tip.y - 6} r={5} fill="#F6F1E3" stroke={colour} strokeWidth={2} />
            )}
            <SvgText x={geom.tip.x + geom.side * 15} y={geom.tip.y - 22}
                     textAnchor={geom.side < 0 ? 'end' : 'start'}
                     fontSize={11} fontWeight="600" fill={T.muted}>
              {`${DOMAINS[g.domain].code}·${pad(i + 1)} — ${Math.round(pct * 100)}%`}
            </SvgText>
            <SvgText x={geom.tip.x + geom.side * 15} y={geom.tip.y - 8}
                     textAnchor={geom.side < 0 ? 'end' : 'start'}
                     fontSize={14} fontFamily={SERIF} fill={T.ink}>
              {(g.title.length > 18 ? g.title.slice(0, 17) + '…' : g.title)
                + (done ? ' ✦' : g.status === 'paused' ? ' (resting)' : g.status === 'maintain' ? ' ↺' : '')}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/* ---------------------------- welcome ----------------------------- */

function Welcome({ state, onBegin }) {
  const q = QUOTES[dayOfYear(new Date()) % QUOTES.length];
  const returning = !!state;
  const [idx, setIdx] = useState(0);

  const stats = returning ? (() => {
    const { goals, log, profile, journalEntries } = state;
    const live = goals.filter((g) => g.status !== 'done');
    let total = 0;
    Object.keys(log).forEach((k) => { total += Object.keys(log[k]).filter((h) => log[k][h]).length; });
    const grown = live.length
      ? Math.round((live.reduce((s, g) => s + goalProgress(g, log).pct, 0) / live.length) * 100) : 0;
    const days = Math.max(1, Math.round((Date.now() - (profile.createdAt || Date.now())) / 86400000));
    const cur = streakOf(log), best = longestStreak(log);
    const done = goals.filter((g) => g.status === 'done').length;
    const out = [
      { label: 'Current streak', value: String(cur), unit: cur === 1 ? 'day' : 'days' },
      { label: 'Longest streak', value: String(best), unit: best === 1 ? 'day' : 'days' },
      { label: 'Steps recorded', value: String(total), unit: total === 1 ? 'check-in' : 'check-ins' },
      { label: 'Tree grown', value: String(grown), unit: '%' },
      { label: 'Growing for', value: String(days), unit: days === 1 ? 'day' : 'days' },
    ];
    if (live.length) out.push({ label: 'Branches growing', value: String(live.length), unit: '' });
    if (done) out.push({ label: 'In the canopy', value: String(done), unit: done === 1 ? 'goal' : 'goals' });
    if ((journalEntries || []).length) out.push({ label: 'Journal entries', value: String(journalEntries.length), unit: '' });
    return out;
  })() : [];

  useEffect(() => {
    if (stats.length < 2) return;
    const id = setInterval(() => setIdx((n) => (n + 1) % stats.length), 2600);
    return () => clearInterval(id);
  }, [stats.length]);

  const s = stats[idx];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40, paddingBottom: 60 }}>
      <Text style={styles.logo}>🌱  Rootine</Text>
      <Shoot />

      {returning ? (
        <>
          <Text style={styles.h1}>Welcome back.</Text>
          {s && (
            <View style={styles.statBox}>
              <Eyebrow>{s.label}</Eyebrow>
              <Text style={styles.statValue}>{s.value}<Text style={styles.statUnit}>  {s.unit}</Text></Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                {stats.map((_, k) => (
                  <View key={k} style={{ width: 5, height: 5, borderRadius: 3,
                    backgroundColor: k === idx ? T.ink : T.rule }} />
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.h1}>Build habits that last.</Text>
          <Text style={styles.body}>
            Set a goal and break it into small, regular steps. Choose the days you'll do them. Tick
            them off as you go. Each step you record grows a branch on your tree, and the tree keeps
            everything you build.
          </Text>
          <Text style={styles.body}>
            Rootine starts each step small and only makes it bigger once you've kept it going for a
            week or two. By then you're used to it, so the increase doesn't feel like much.
          </Text>
          <Text style={styles.body}>
            Habits build on each other. One kept routine makes the next one easier to start — which
            is why a finished goal here can branch into a new one.
          </Text>
        </>
      )}

      <View style={styles.quoteBox}>
        <Text style={styles.quoteText}>"{q.t}"</Text>
        <Eyebrow style={{ marginTop: 8 }}>— {q.a}</Eyebrow>
      </View>

      <Button onPress={onBegin} style={{ alignSelf: 'flex-start' }}>
        {returning ? 'Open my tree' : 'Begin'}
      </Button>
    </ScrollView>
  );
}

/* --------------------------- onboarding --------------------------- */

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [pace, setPace] = useState('gentle');
  const [motives, setMotives] = useState([]);
  const [domain, setDomain] = useState('body');
  const [title, setTitle] = useState('');
  const [whys, setWhys] = useState(['']);
  const [journal, setJournal] = useState('off');
  const [hTitle, setHTitle] = useState('');
  const [days, setDays] = useState([0, 2, 4]);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('minutes');

  const toggleMotive = (m) => setMotives((v) => v.includes(m) ? v.filter((x) => x !== m) : [...v, m]);
  const preview = targetAt({ days, amount: Number(amount) || null }, 0, PACES[pace]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 36, paddingBottom: 320 }}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      <Text style={styles.logo}>🌱  Rootine</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 2, backgroundColor: i <= step ? T.ink : T.rule }} />
        ))}
      </View>

      <Card style={{ padding: 20 }}>
        {step === 0 && (
          <>
            <Text style={styles.h2}>How easily do new habits stick?</Text>
            <Text style={styles.sub}>Be honest — this sets how small you start. You can change it later.</Text>
            {Object.values(PACES).map((p) => (
              <TouchableOpacity key={p.key} onPress={() => setPace(p.key)}
                style={[styles.optionRow, { borderColor: pace === p.key ? T.ink : T.rule }]}>
                <Text style={{ fontWeight: '600', fontSize: 15, color: T.ink }}>{p.label}</Text>
                <Text style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>{p.blurb}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.h2}>Why does this matter to you?</Text>
            <Text style={styles.sub}>Pick any that fit, or none.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MOTIVES.map((m) => (
                <Chip key={m} active={motives.includes(m)} onPress={() => toggleMotive(m)}>{m}</Chip>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.h2}>Name one goal to start</Text>
            <Text style={styles.sub}>One branch is enough. You can grow the tree later.</Text>
            <Field label="Area">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(DOMAINS).map((k) => (
                  <Chip key={k} active={domain === k} onPress={() => setDomain(k)}>{DOMAINS[k].label}</Chip>
                ))}
              </View>
              <Text style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>{DOMAINS[domain].hint}</Text>
            </Field>
            <Field label="Goal">
              <TextInput style={styles.input} value={title} onChangeText={setTitle}
                         placeholder="Feeling fitter" placeholderTextColor={T.muted} />
            </Field>
            <WhyList rows={whys} setRows={setWhys} />
            <JournalPicker value={journal} onChange={setJournal} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.h2}>What's the step?</Text>
            <Text style={styles.sub}>
              Put down where you'd like to get to, not where you're starting. Rootine sets the first
              few weeks lower than that, and raises it once you've kept it going.
            </Text>
            <Field label="Activity">
              <TextInput style={styles.input} value={hTitle} onChangeText={setHTitle}
                         placeholder="Run" placeholderTextColor={T.muted} />
            </Field>
            <Field label="Which days? (any day still counts)">
              <DayPicker days={days} onChange={setDays} colour={DOMAINS[domain].colour} />
            </Field>
            <Field label="Amount (optional)">
              <TextInput style={styles.input} value={amount} onChangeText={setAmount}
                         keyboardType="numeric" placeholder="e.g. 30 — leave blank for none" placeholderTextColor={T.muted} />
            </Field>
            <Field label="Unit">
              <UnitPicker unit={unit} onChange={setUnit} />
            </Field>
            {hTitle.trim() !== '' && (
              <View style={{ borderTopWidth: 1, borderTopColor: T.rule, paddingTop: 14 }}>
                <Eyebrow style={{ marginBottom: 6 }}>Week one asks for</Eyebrow>
                <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>
                  {hTitle} {preview.times}×{preview.amount ? ` · ${preview.amount} ${unit}` : ''}
                </Text>
                <Text style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
                  Growing toward {days.length}×{amount ? ` · ${amount} ${unit}` : ''}.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' }}>
          {step > 0 ? <Button tone="bare" onPress={() => setStep(step - 1)}>‹ Back</Button> : <View />}
          {step < 3 ? (
            <Button onPress={() => setStep(step + 1)} disabled={step === 2 && !title.trim()}>Continue</Button>
          ) : (
            <Button disabled={!hTitle.trim() || !days.length}
              onPress={() => onDone({
                profile: { pace, motives, reminder: '08:00', buddy: '', handle: '', createdAt: Date.now() },
                goal: {
                  id: uid(), title: title.trim(), why: whys.filter((w) => w.trim()).join('\n'),
                  domain, status: 'active', journal, pauses: [], createdAt: Date.now(),
                  habits: [{ id: uid(), title: hTitle.trim(), days,
                             amount: Number(amount) || null, unit: unit || 'minutes', createdAt: Date.now() }],
                },
              })}>
              Plant it
            </Button>
          )}
        </View>
      </Card>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ----------------------------- today ------------------------------ */

function Today({ state, setState, onGrow }) {
  const { goals, log, profile } = state;
  const pace = PACES[profile.pace];
  const now = new Date();
  const today = dk(now);
  const tIdx = dayIdx(now);
  const streak = streakOf(log);
  const [skipped, setSkipped] = useState([]);
  const [journalText, setJournalText] = useState({});
  const [reflectPick, setReflectPick] = useState(null);
  const [reflectNote, setReflectNote] = useState('');

  const toggle = (habitId) => setState((s) => {
    const day = Object.assign({}, s.log[today]);
    if (day[habitId]) delete day[habitId]; else day[habitId] = true;
    return Object.assign({}, s, { log: Object.assign({}, s.log, { [today]: day }) });
  });

  const setStatus = (goalId, status) => setState((s) => Object.assign({}, s, {
    goals: s.goals.map((g) => (g.id === goalId ? Object.assign({}, g, { status }) : g)) }));

  const extendRest = (goalId) => setState((s) => Object.assign({}, s, {
    goals: s.goals.map((g) => g.id === goalId
      ? Object.assign({}, g, { pauses: g.pauses.map((p, i) =>
          i === g.pauses.length - 1 ? Object.assign({}, p, { to: Date.now() + 7 * 86400000 }) : p) })
      : g) }));

  const live = goals.filter((g) => g.status === 'active' || g.status === 'maintain');
  const completed = goals.filter((g) => g.status === 'active' && goalProgress(g, log).pct >= 1);
  const woken = goals.filter((g) => g.status === 'paused' &&
    ((g.pauses[g.pauses.length - 1] || {}).to || 0) <= Date.now());

  const weekKey = dk(weekStart(now));
  const showReflection = tIdx === 6 && !state.reflections[weekKey] && live.length > 0;
  const saveReflection = (pick, note) => setState((s) => Object.assign({}, s, {
    reflections: Object.assign({}, s.reflections, { [weekKey]: { pick, note, at: Date.now() } }) }));

  const showBuddy = !!(profile.buddy || '').trim() && live.length > 0 &&
    (!state.lastSharedAt || Date.now() - state.lastSharedAt > 6 * 86400000);

  const dueJournals = journalDue(goals, state.journalEntries, now)
    .filter((d) => !skipped.includes(d.goal.id + d.cadence));

  const saveJournal = (goal, cadence, prompt, text) => {
    setState((s) => Object.assign({}, s, { journalEntries: [...s.journalEntries,
      { id: uid(), at: Date.now(), goalId: goal.id, goalTitle: goal.title, cadence, prompt, text }] }));
    setJournalText(Object.assign({}, journalText, { [goal.id]: '' }));
  };

  const shareProgress = async () => {
    const liveG = goals.filter((g) => g.status !== 'done');
    const grown = liveG.length
      ? Math.round((liveG.reduce((s, g) => s + goalProgress(g, log).pct, 0) / liveG.length) * 100) : 0;
    let msg = `My Rootine tree is ${grown}% grown. Streak: ${streakOf(log)} days.\n\n`;
    liveG.forEach((g) => { msg += `• ${g.title} — ${Math.round(goalProgress(g, log).pct * 100)}%\n`; });
    try { await Share.share({ message: msg }); } catch (e) { /* cancelled */ }
    setState((s) => Object.assign({}, s, { lastSharedAt: Date.now() }));
  };

  const rows = [];
  live.forEach((g) => g.habits.forEach((h) => {
    rows.push({ g, h, st: habitState(h, log, pace, g.pauses), scheduled: h.days.includes(tIdx) });
  }));
  const onToday = rows.filter((r) => r.scheduled);
  const offToday = rows.filter((r) => !r.scheduled);
  const remaining = onToday.filter((r) => !(log[today] && log[today][r.h.id])).length;

  const renderRow = ({ g, h, st, quiet }) => {
    const ticked = !!(log[today] && log[today][h.id]);
    const c = DOMAINS[g.domain].colour;
    return (
      <Card style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: quiet ? T.rule : c,
                     opacity: quiet && !ticked ? 0.72 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TickButton ticked={ticked} colour={c} onPress={() => toggle(h.id)} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 18, color: T.ink }}>
              {h.title}{st.target.amount ? ` — ${st.target.amount} ${h.unit}` : ''}
            </Text>
            <Text style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
              {g.title}{g.status === 'maintain' ? ' · upkeep' : ''} · {st.done} of {st.target.times} this week
              {!st.atFull && g.status === 'active' ? ` · building to ${h.days.length}×` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: st.target.times }).map((_, i) => (
              <View key={i} style={{ width: 6, height: 20, borderRadius: 1,
                backgroundColor: i < st.done ? c : T.dead }} />
            ))}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      {completed.map((g) => (
        <Card key={g.id} style={{ padding: 18, borderLeftWidth: 3, borderLeftColor: T.gold }}>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>
            🏆 "{g.title}" has reached full growth.
          </Text>
          <Text style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 21 }}>
            {MATURITY} check-ins. The habit is part of you now — what happens to the branch?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Button onPress={() => setStatus(g.id, 'maintain')}>Keep tending it</Button>
            <Button tone="quiet" onPress={() => setStatus(g.id, 'done')}>Set in the canopy</Button>
            <Button tone="quiet" onPress={() => onGrow(g)}>Branch out</Button>
          </View>
        </Card>
      ))}

      {woken.map((g) => (
        <Card key={g.id} style={{ padding: 18, borderLeftWidth: 3, borderLeftColor: DOMAINS[g.domain].colour }}>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>
            "{g.title}" has finished resting.
          </Text>
          <Text style={{ fontSize: 14, color: T.muted, marginTop: 4 }}>
            Rest is part of growth. Ready to pick it back up?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Button onPress={() => setStatus(g.id, 'active')}>Pick it back up</Button>
            <Button tone="quiet" onPress={() => extendRest(g.id)}>Rest another week</Button>
          </View>
        </Card>
      ))}

      {dueJournals.map(({ goal, cadence, prompt }) => (
        <Card key={goal.id + cadence} style={{ padding: 18, borderLeftWidth: 3, borderLeftColor: DOMAINS[goal.domain].colour }}>
          <Eyebrow>{cadence === 'daily' ? 'Daily' : 'Weekly'} journal — {goal.title}</Eyebrow>
          <Text style={{ fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', color: T.ink, marginVertical: 10 }}>
            {prompt}
          </Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline
            value={journalText[goal.id] || ''}
            onChangeText={(v) => setJournalText(Object.assign({}, journalText, { [goal.id]: v }))}
            placeholder="Write as much or as little as you like…" placeholderTextColor={T.muted} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Button disabled={!(journalText[goal.id] || '').trim()}
              onPress={() => saveJournal(goal, cadence, prompt, (journalText[goal.id] || '').trim())}>
              Save entry
            </Button>
            <Button tone="bare" onPress={() => setSkipped([...skipped, goal.id + cadence])}>Not today</Button>
          </View>
        </Card>
      ))}

      {showReflection && (
        <Card style={{ padding: 18 }}>
          <Eyebrow>Sunday check-in</Eyebrow>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink, marginVertical: 10 }}>
            How did this week feel?
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {REFLECTIONS.map((r) => (
              <TouchableOpacity key={r.k} onPress={() => setReflectPick(r.k)}
                style={[styles.reflectBtn, { borderColor: reflectPick === r.k ? T.ink : T.rule }]}>
                <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                <Text style={{ fontSize: 12, color: T.ink, marginTop: 4 }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {reflectPick && (
            <TextInput style={[styles.input, { marginTop: 12, height: 70, textAlignVertical: 'top' }]} multiline
              value={reflectNote} onChangeText={setReflectNote}
              placeholder="Anything worth remembering — optional" placeholderTextColor={T.muted} />
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button disabled={!reflectPick} onPress={() => saveReflection(reflectPick, reflectNote.trim())}>Save</Button>
            <Button tone="bare" onPress={() => saveReflection('skipped', '')}>Skip this week</Button>
          </View>
        </Card>
      )}

      {showBuddy && (
        <Card style={{ padding: 16 }}>
          <Text style={{ fontSize: 15, color: T.ink }}>
            Show {profile.buddy} how the tree's coming along?
          </Text>
          <Text style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
            A weekly nudge — someone knowing helps it stick.
          </Text>
          <Button tone="quiet" onPress={shareProgress} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
            Share progress
          </Button>
        </Card>
      )}

      <Card style={{ padding: 18 }}>
        <Eyebrow>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Eyebrow>
        <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 23, color: T.ink, marginTop: 6 }}>
          {onToday.length === 0 ? 'A rest day by design.'
            : remaining === 0 ? "Today's steps are done."
            : `${remaining} step${remaining === 1 ? '' : 's'} planned for today.`}
        </Text>
        <Text style={{ fontSize: 14, color: T.muted, marginTop: 8, fontStyle: 'italic' }}>
          "{nudgeFor(profile, now)}"
        </Text>
        <Text style={{ fontSize: 14, color: streak ? '#B07A2B' : T.muted, marginTop: 10 }}>
          🔥 {streak} day{streak === 1 ? '' : 's'}
        </Text>
      </Card>

      {rows.length === 0 && (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>Nothing to record yet</Text>
          <Text style={{ fontSize: 15, color: T.muted, marginTop: 6 }}>Add a goal to grow your first branch.</Text>
        </Card>
      )}

      {onToday.map((r) => <View key={r.h.id}>{renderRow(r)}</View>)}

      {offToday.length > 0 && (
        <>
          <Eyebrow style={{ marginTop: 6 }}>Not scheduled today — still counts</Eyebrow>
          {offToday.map((r) => <View key={r.h.id}>{renderRow({ ...r, quiet: true })}</View>)}
        </>
      )}

      <Text style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
        🔔 Nudges at {profile.reminder} on your chosen days.
      </Text>
    </View>
  );
}

/* ----------------------------- goals ------------------------------ */

function Goals({ state, setState, growSeed, clearGrowSeed }) {
  const { goals, log, profile } = state;
  const pace = PACES[profile.pace];
  const [adding, setAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [habitFor, setHabitFor] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [pausing, setPausing] = useState(null);

  const [gTitle, setGTitle] = useState('');
  const [gWhys, setGWhys] = useState(['']);
  const [gDomain, setGDomain] = useState('body');
  const [gJournal, setGJournal] = useState('off');
  const [gParent, setGParent] = useState(null);

  const [hTitle, setHTitle] = useState('');
  const [hDays, setHDays] = useState([0, 2, 4]);
  const [hAmount, setHAmount] = useState('');
  const [hUnit, setHUnit] = useState('minutes');

  useEffect(() => {
    if (growSeed) {
      setAdding(true); setGDomain(growSeed.domain); setGParent(growSeed.title);
      setGWhys([`Building on "${growSeed.title}"`]); clearGrowSeed();
    }
  }, [growSeed]);

  const resetGoalForm = () => { setGTitle(''); setGWhys(['']); setGJournal('off'); setGParent(null); };
  const resetHabitForm = () => { setHTitle(''); setHDays([0, 2, 4]); setHAmount(''); setHUnit('minutes'); };

  const patchGoal = (id, patch) => setState((s) => Object.assign({}, s, {
    goals: s.goals.map((g) => (g.id === id ? Object.assign({}, g, patch) : g)) }));

  const addGoal = () => {
    if (!gTitle.trim()) return;
    setState((s) => Object.assign({}, s, { goals: [...s.goals, {
      id: uid(), title: gTitle.trim(), why: gWhys.filter((w) => w.trim()).join('\n'),
      domain: gDomain, status: 'active', journal: gJournal, pauses: [], parentTitle: gParent,
      createdAt: Date.now(), habits: [] }] }));
    resetGoalForm(); setAdding(false);
  };

  const saveHabit = (goalId) => {
    if (!hTitle.trim() || !hDays.length) return;
    const data = { title: hTitle.trim(), days: hDays, amount: Number(hAmount) || null, unit: hUnit || 'minutes' };
    setState((s) => Object.assign({}, s, { goals: s.goals.map((g) => {
      if (g.id !== goalId) return g;
      if (editingHabit) {
        return Object.assign({}, g, { habits: g.habits.map((h) =>
          h.id === editingHabit ? Object.assign({}, h, data) : h) });
      }
      return Object.assign({}, g, { habits: [...g.habits,
        Object.assign({ id: uid(), createdAt: Date.now() }, data)] });
    }) }));
    resetHabitForm(); setHabitFor(null); setEditingHabit(null);
  };

  const pauseGoal = (id, weeks) => {
    setState((s) => Object.assign({}, s, { goals: s.goals.map((g) => g.id === id
      ? Object.assign({}, g, { status: 'paused',
          pauses: [...g.pauses, { from: Date.now(), to: Date.now() + weeks * 7 * 86400000 }] })
      : g) }));
    setPausing(null);
  };

  const active = goals.filter((g) => g.status !== 'done');
  const canopy = goals.filter((g) => g.status === 'done');

  // Plain function, NOT a nested component: defining a component inside another
  // makes React remount it on every render, which drops keyboard focus each keystroke.
  const renderHabitForm = (goalId, colour) => (
    <View style={{ borderTopWidth: 1, borderTopColor: T.rule, paddingTop: 12, marginTop: 8 }}>
      <Field label="Activity">
        <TextInput style={styles.input} value={hTitle} onChangeText={setHTitle}
                   placeholder="Swim" placeholderTextColor={T.muted} />
      </Field>
      <Field label="Which days?">
        <DayPicker days={hDays} onChange={setHDays} colour={colour} />
      </Field>
      <Field label="Amount (optional)">
        <TextInput style={styles.input} value={hAmount} onChangeText={setHAmount}
                   keyboardType="numeric" placeholder="e.g. 20 — leave blank for none" placeholderTextColor={T.muted} />
      </Field>
      <Field label="Unit">
        <UnitPicker unit={hUnit} onChange={setHUnit} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button onPress={() => saveHabit(goalId)}>{editingHabit ? 'Save step' : 'Add step'}</Button>
        <Button tone="bare" onPress={() => { setHabitFor(null); setEditingHabit(null); resetHabitForm(); }}>Cancel</Button>
      </View>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      {active.map((g) => {
        const d = DOMAINS[g.domain];
        const { pct, total } = goalProgress(g, log);
        const paused = g.status === 'paused';
        const until = paused ? new Date((g.pauses[g.pauses.length - 1] || {}).to || Date.now()) : null;
        const isEditing = editingGoal === g.id;

        return (
          <Card key={g.id} style={{ padding: 18, opacity: paused ? 0.85 : 1 }}>
            {isEditing ? (
              <View>
                <Field label="Area">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Object.keys(DOMAINS).map((k) => (
                      <Chip key={k} active={gDomain === k} onPress={() => setGDomain(k)}>{DOMAINS[k].label}</Chip>
                    ))}
                  </View>
                </Field>
                <Field label="Goal">
                  <TextInput style={styles.input} value={gTitle} onChangeText={setGTitle} />
                </Field>
                <WhyList rows={gWhys} setRows={setGWhys} />
                <JournalPicker value={gJournal} onChange={setGJournal} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button onPress={() => {
                    patchGoal(g.id, { title: gTitle.trim() || g.title,
                      why: gWhys.filter((w) => w.trim()).join('\n'), domain: gDomain, journal: gJournal });
                    setEditingGoal(null); resetGoalForm();
                  }}>Save</Button>
                  <Button tone="bare" onPress={() => { setEditingGoal(null); resetGoalForm(); }}>Cancel</Button>
                </View>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Eyebrow>
                      {d.code}·{pad(goals.indexOf(g) + 1)} — {d.label}
                      {g.status === 'maintain' ? ' · tending' : ''}
                      {paused ? ` · resting until ${until.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </Eyebrow>
                    <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 21, color: T.ink, marginTop: 4 }}>{g.title}</Text>
                    {g.parentTitle && (
                      <Text style={{ fontSize: 11, color: T.muted, marginTop: 3, letterSpacing: 0.5 }}>
                        GREW FROM "{g.parentTitle.toUpperCase()}"
                      </Text>
                    )}
                    {whyToList(g.why).map((w, k) => (
                      <Text key={k} style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>{w}</Text>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => {
                      setEditingGoal(g.id); setGTitle(g.title); setGDomain(g.domain);
                      setGJournal(g.journal || 'off');
                      setGWhys(whyToList(g.why).length ? whyToList(g.why) : ['']);
                    }}>
                      <Text style={{ fontSize: 16 }}>✎</Text>
                    </TouchableOpacity>
                    {g.status === 'active' && (
                      <TouchableOpacity onPress={() => setPausing(pausing === g.id ? null : g.id)}>
                        <Text style={{ fontSize: 16 }}>⏸</Text>
                      </TouchableOpacity>
                    )}
                    {paused && (
                      <TouchableOpacity onPress={() => patchGoal(g.id, { status: 'active' })}>
                        <Text style={{ fontSize: 16 }}>▶</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setState((s) => Object.assign({}, s, {
                      goals: s.goals.filter((x) => x.id !== g.id) }))}>
                      <Text style={{ fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {pausing === g.id && (
                  <View style={{ borderTopWidth: 1, borderTopColor: T.rule, marginTop: 12, paddingTop: 12 }}>
                    <Eyebrow style={{ marginBottom: 8 }}>Rest this goal for…</Eyebrow>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[1, 2, 4].map((w) => (
                        <Chip key={w} onPress={() => pauseGoal(g.id, w)}>{w} week{w > 1 ? 's' : ''}</Chip>
                      ))}
                    </View>
                    <Text style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>
                      No nudges, nothing counting against you, and the branch keeps everything it's grown.
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 14 }}>
                  <View style={{ height: 5, backgroundColor: T.dead, borderRadius: 3 }}>
                    <View style={{ height: 5, width: `${pct * 100}%`, backgroundColor: d.colour, borderRadius: 3 }} />
                  </View>
                  <Eyebrow style={{ marginTop: 6 }}>
                    {total}/{MATURITY} check-ins · {Math.round(pct * 100)}% grown
                  </Eyebrow>
                </View>

                {g.habits.map((h) => {
                  const st = habitState(h, log, pace, g.pauses);
                  if (editingHabit === h.id) return <View key={h.id}>{renderHabitForm(g.id, d.colour)}</View>;
                  return (
                    <View key={h.id} style={{ borderTopWidth: 1, borderTopColor: T.rule,
                                              paddingVertical: 10, marginTop: 8, flexDirection: 'row' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, color: T.ink }}>{h.title}</Text>
                        <Text style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
                          Now: {st.target.times}×/wk{st.target.amount ? `, ${st.target.amount} ${h.unit}` : ''}
                          {' · '}Aim: {h.days.map((di) => DAY_LETTERS[di]).join(' ')}
                          {h.amount ? `, ${h.amount} ${h.unit}` : ', no amount set'}
                          {st.atFull ? ' · full strength' : ` · stage ${st.level + 1}`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => {
                          setEditingHabit(h.id); setHabitFor(null);
                          setHTitle(h.title); setHDays(h.days);
                          setHAmount(h.amount ? String(h.amount) : ''); setHUnit(h.unit);
                        }}>
                          <Text style={{ fontSize: 15 }}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setState((s) => Object.assign({}, s, {
                          goals: s.goals.map((gg) => gg.id === g.id
                            ? Object.assign({}, gg, { habits: gg.habits.filter((hh) => hh.id !== h.id) })
                            : gg) }))}>
                          <Text style={{ fontSize: 15 }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {habitFor === g.id
                  ? renderHabitForm(g.id, d.colour)
                  : (
                    <Button tone="quiet" onPress={() => { setHabitFor(g.id); setEditingHabit(null); resetHabitForm(); }}
                            style={{ marginTop: 10, alignSelf: 'flex-start' }}>+ Add a step</Button>
                  )}
              </>
            )}
          </Card>
        );
      })}

      {adding ? (
        <Card style={{ padding: 18 }}>
          {gParent && (
            <Text style={{ fontSize: 11, color: T.muted, marginBottom: 10, letterSpacing: 0.5 }}>
              BRANCHING OUT FROM "{gParent.toUpperCase()}"
            </Text>
          )}
          <Field label="Area">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(DOMAINS).map((k) => (
                <Chip key={k} active={gDomain === k} onPress={() => setGDomain(k)}>{DOMAINS[k].label}</Chip>
              ))}
            </View>
          </Field>
          <Field label="Goal">
            <TextInput style={styles.input} value={gTitle} onChangeText={setGTitle}
                       placeholder="A calmer start to the day" placeholderTextColor={T.muted} />
          </Field>
          <WhyList rows={gWhys} setRows={setGWhys} />
          <JournalPicker value={gJournal} onChange={setGJournal} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button onPress={addGoal}>Add goal</Button>
            <Button tone="bare" onPress={() => { setAdding(false); resetGoalForm(); }}>Cancel</Button>
          </View>
        </Card>
      ) : (
        <Button tone="quiet" onPress={() => { setAdding(true); resetGoalForm(); }}>+ New goal</Button>
      )}

      {canopy.length > 0 && (
        <>
          <Eyebrow style={{ marginTop: 8 }}>The canopy — completed and kept</Eyebrow>
          {canopy.map((g) => (
            <Card key={g.id} style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: T.gold }}>
              <Text style={{ fontFamily: SERIF, fontSize: 18, color: T.ink }}>{g.title} ✦</Text>
              <Text style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
                Fully grown · {goalProgress(g, log).total} check-ins in the wood
              </Text>
              <Button tone="bare" onPress={() => patchGoal(g.id, { status: 'maintain' })}
                      style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 4 }}>Tend again</Button>
            </Card>
          ))}
        </>
      )}
    </View>
  );
}

/* ---------------------------- numbers ----------------------------- */

function Numbers({ state }) {
  const { goals, log } = state;
  const live = goals.filter((g) => g.status !== 'done');
  const weeks = weeklyCompletion(goals, log, 8);
  let total = 0;
  Object.keys(log).forEach((k) => { total += Object.keys(log[k]).filter((h) => log[k][h]).length; });

  const renderStat = (label, value) => (
    <View style={{ width: '48%', marginBottom: 18 }}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 26, color: T.ink, marginTop: 4 }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 18 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <View key="cs">{renderStat("Current streak", `${streakOf(log)}d`)}</View>
          <View key="ls">{renderStat("Longest streak", `${longestStreak(log)}d`)}</View>
          <View key="tc">{renderStat("Total check-ins", total)}</View>
          <View key="ab">{renderStat("Active branches", live.length)}</View>
        </View>

        <Eyebrow style={{ marginBottom: 10 }}>Weekly completion, last 8 weeks</Eyebrow>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 }}>
          {weeks.map((w, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '100%', height: w.pct == null ? 3 : Math.max(3, w.pct),
                             backgroundColor: w.pct == null ? T.dead : i === weeks.length - 1 ? T.bark : shade(T.bark, 30),
                             borderRadius: 2 }} />
              <Text style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>{w.label.split(' ')[0]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
          % of scheduled steps completed each week. Grey means no steps existed yet.
        </Text>
      </Card>

      {live.map((g) => {
        const { pct, total: t } = goalProgress(g, log);
        return (
          <Card key={g.id} style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, color: T.ink }}>{g.title}</Text>
              <Text style={{ fontSize: 12, color: T.muted }}>{t}/{MATURITY}</Text>
            </View>
            <View style={{ height: 5, backgroundColor: T.dead, borderRadius: 3 }}>
              <View style={{ height: 5, width: `${pct * 100}%`,
                             backgroundColor: DOMAINS[g.domain].colour, borderRadius: 3 }} />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

/* ---------------------------- journal ----------------------------- */

function Journal({ state, setState }) {
  const { goals, journalEntries } = state;
  const live = goals.filter((g) => g.status !== 'done');
  const [composing, setComposing] = useState(false);
  const [goalId, setGoalId] = useState('');
  const [text, setText] = useState('');

  const save = () => {
    if (!text.trim()) return;
    const goal = live.find((g) => g.id === goalId);
    setState((s) => Object.assign({}, s, { journalEntries: [...s.journalEntries, {
      id: uid(), at: Date.now(), goalId: goal ? goal.id : null,
      goalTitle: goal ? goal.title : 'General', cadence: 'note', prompt: null, text: text.trim() }] }));
    setText(''); setGoalId(''); setComposing(false);
  };

  const sorted = [...journalEntries].sort((a, b) => b.at - a.at);

  return (
    <View style={{ gap: 12 }}>
      {composing ? (
        <Card style={{ padding: 18 }}>
          <Field label="About">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Chip active={goalId === ''} onPress={() => setGoalId('')}>General</Chip>
                {live.map((g) => (
                  <Chip key={g.id} active={goalId === g.id} onPress={() => setGoalId(g.id)}>{g.title}</Chip>
                ))}
              </View>
            </ScrollView>
          </Field>
          <TextInput style={[styles.input, { height: 110, textAlignVertical: 'top' }]} multiline
            value={text} onChangeText={setText}
            placeholder="Write whatever's on your mind…" placeholderTextColor={T.muted} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Button disabled={!text.trim()} onPress={save}>Save entry</Button>
            <Button tone="bare" onPress={() => { setComposing(false); setText(''); }}>Cancel</Button>
          </View>
        </Card>
      ) : (
        <Button tone="quiet" onPress={() => setComposing(true)}>+ Write an entry</Button>
      )}

      {sorted.length === 0 && !composing && (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>Nothing written yet</Text>
          <Text style={{ fontSize: 15, color: T.muted, marginTop: 6, textAlign: 'center' }}>
            Turn on daily or weekly journalling for a goal, or just write whenever you like.
          </Text>
        </Card>
      )}

      {sorted.map((e) => {
        const goal = goals.find((g) => g.id === e.goalId);
        const colour = goal ? DOMAINS[goal.domain].colour : T.muted;
        return (
          <Card key={e.id} style={{ padding: 16, borderLeftWidth: 3, borderLeftColor: colour }}>
            <Eyebrow>
              {new Date(e.at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {e.goalTitle}
            </Eyebrow>
            {e.prompt && (
              <Text style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: T.muted, marginTop: 6 }}>
                {e.prompt}
              </Text>
            )}
            <Text style={{ fontSize: 15, color: T.ink, lineHeight: 23, marginTop: 6 }}>{e.text}</Text>
          </Card>
        );
      })}
    </View>
  );
}

/* ------------------------------ grove ----------------------------- */

function Grove({ state, setState }) {
  const { profile } = state;
  const handle = (profile.handle || '').trim();
  const posts = state.grovePosts || [];
  const cheered = state.cheered || {};
  const [text, setText] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [picking, setPicking] = useState(null);
  const chips = achievementChips(state);

  const post = () => {
    if (!text.trim() || !handle) return;
    setState((s) => Object.assign({}, s, { grovePosts: [...(s.grovePosts || []),
      { id: uid(), at: Date.now(), who: handle, text: text.trim().slice(0, 140), reactions: {} }] }));
    setText('');
  };

  const react = (id, key) => {
    const prev = cheered[id];
    const next = prev === key ? null : key;
    setPicking(null);
    setState((s) => {
      const c = Object.assign({}, s.cheered);
      if (next) c[id] = next; else delete c[id];
      return Object.assign({}, s, { cheered: c, grovePosts: (s.grovePosts || []).map((p) => {
        if (p.id !== id) return p;
        const r = Object.assign({}, p.reactions);
        if (prev) r[prev] = Math.max(0, (r[prev] || 0) - 1);
        if (next) r[next] = (r[next] || 0) + 1;
        return Object.assign({}, p, { reactions: r });
      }) });
    });
  };

  const sorted = [...posts].sort((a, b) => b.at - a.at);

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 18 }}>
        <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 22, color: T.ink }}>The Grove</Text>
        <Text style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 21 }}>
          Post a milestone when you reach one. Only what you post here is shared — never your goals,
          log or journal.
        </Text>
        <Text style={{ fontSize: 13, color: T.gold, marginTop: 10 }}>
          Note: in this trial build the Grove is local to your phone, so you'll only see your own
          posts. Connecting people needs a server, which comes with the real build.
        </Text>
      </Card>

      {!handle ? (
        <Card style={{ padding: 18 }}>
          <Field label="Choose a name to take part">
            <TextInput style={styles.input} value={nameDraft} onChangeText={setNameDraft}
                       maxLength={24} placeholder="First name or a nickname" placeholderTextColor={T.muted} />
          </Field>
          <Button disabled={!nameDraft.trim()}
            onPress={() => setState((s) => Object.assign({}, s, {
              profile: Object.assign({}, s.profile, { handle: nameDraft.trim() }) }))}>
            Join the Grove
          </Button>
        </Card>
      ) : (
        <Card style={{ padding: 18 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Posting as {handle}</Eyebrow>
          {chips.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {chips.map((c) => <Chip key={c} active={text === c} onPress={() => setText(c)}>{c}</Chip>)}
              </View>
            </ScrollView>
          )}
          <TextInput style={styles.input} value={text} onChangeText={setText} maxLength={140}
                     placeholder="Or write your own — 140 characters" placeholderTextColor={T.muted} />
          <Button onPress={post} disabled={!text.trim()} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
            Post to the Grove
          </Button>
        </Card>
      )}

      {sorted.length === 0 && (
        <Card style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: headFont(), fontWeight: headWeight(), fontSize: 19, color: T.ink }}>Quiet in here so far</Text>
          <Text style={{ fontSize: 15, color: T.muted, marginTop: 6 }}>Post your first milestone.</Text>
        </Card>
      )}

      {sorted.map((p) => {
        const given = cheered[p.id];
        const reactions = ENCOURAGEMENTS
          .map((e) => Object.assign({}, e, { n: (p.reactions || {})[e.k] || 0 }))
          .filter((e) => e.n > 0);
        return (
          <Card key={p.id} style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: T.gold }}>
            <Eyebrow>{p.who} · {timeAgo(p.at)}</Eyebrow>
            <Text style={{ fontSize: 16, color: T.ink, marginTop: 6, lineHeight: 23 }}>{p.text}</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {reactions.map((e) => (
                <View key={e.k} style={[styles.reactPill, { borderColor: given === e.k ? DOMAINS.body.colour : T.rule }]}>
                  <Text style={{ fontSize: 13 }}>{e.glyph} {e.n}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={() => setPicking(picking === p.id ? null : p.id)}
                style={[styles.reactPill, { borderColor: T.rule }]}>
                <Text style={{ fontSize: 12, color: T.muted }}>{given ? 'Change' : 'Encourage'}</Text>
              </TouchableOpacity>
            </View>

            {picking === p.id && (
              <View style={{ borderTopWidth: 1, borderTopColor: T.rule, marginTop: 10, paddingTop: 10 }}>
                {ENCOURAGEMENTS.map((e) => (
                  <TouchableOpacity key={e.k} onPress={() => react(p.id, e.k)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 17, width: 24 }}>{e.glyph}</Text>
                    <Text style={{ fontSize: 14, color: T.ink, fontWeight: '500' }}>{e.label}</Text>
                    <Text style={{ fontSize: 13, color: T.muted, flex: 1 }}>{e.note}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

/* ---------------------------- settings ---------------------------- */

function Setup({ state, setState, onReset }) {
  const { profile, goals } = state;

  const seed = () => setState((s) => {
    const log = Object.assign({}, s.log);
    for (let i = 41; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const key = dk(d), di = dayIdx(d);
      const day = Object.assign({}, log[key]);
      s.goals.forEach((g) => g.habits.forEach((h) => {
        const chance = (0.35 + 0.5 * ((41 - i) / 41)) * (h.days.includes(di) ? 1 : 0.12);
        if (Math.random() < chance) day[h.id] = true;
      }));
      if (Object.keys(day).length) log[key] = day;
    }
    return Object.assign({}, s, { log });
  });

  const patchProfile = (patch) => setState((s) => Object.assign({}, s, {
    profile: Object.assign({}, s.profile, patch) }));

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 18 }}>
        <Eyebrow style={{ marginBottom: 10 }}>Appearance</Eyebrow>
        {Object.keys(THEMES).map((k) => {
          const th = THEMES[k];
          const on = (profile.theme || 'herbarium') === k;
          return (
            <TouchableOpacity key={k}
              onPress={() => { applyTheme(k); patchProfile({ theme: k }); }}
              style={[styles.optionRow, { borderColor: on ? T.ink : T.rule,
                                          borderWidth: on ? S.border + 0.5 : S.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Object.keys(th.d).map((dk2) => (
                    <View key={dk2} style={{ width: 14, height: 14, borderRadius: 7,
                                             backgroundColor: th.d[dk2] }} />
                  ))}
                </View>
                <Text style={{ fontWeight: '700', fontSize: 15, color: T.ink }}>{th.label}</Text>
                {on && <Text style={{ fontSize: 13, color: T.muted }}>· current</Text>}
              </View>
              <Text style={{ fontSize: 14, color: T.muted, marginTop: 5 }}>{th.blurb}</Text>
            </TouchableOpacity>
          );
        })}
      </Card>

      <Card style={{ padding: 18 }}>
        <Eyebrow style={{ marginBottom: 10 }}>Pace</Eyebrow>
        {Object.values(PACES).map((p) => (
          <TouchableOpacity key={p.key} onPress={() => patchProfile({ pace: p.key })}
            style={[styles.optionRow, { borderColor: profile.pace === p.key ? T.ink : T.rule }]}>
            <Text style={{ fontWeight: '600', fontSize: 15, color: T.ink }}>{p.label}</Text>
            <Text style={{ fontSize: 14, color: T.muted, marginTop: 3 }}>{p.blurb}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={{ padding: 18 }}>
        <Field label="Nudge time">
          <TextInput style={[styles.input, { maxWidth: 140 }]} value={profile.reminder}
                     onChangeText={(v) => patchProfile({ reminder: v })} placeholder="08:00"
                     placeholderTextColor={T.muted} />
        </Field>
        <Text style={{ fontSize: 13, color: T.muted }}>
          Shown in-app in this trial. Real phone notifications come with the installed build.
        </Text>
      </Card>

      <Card style={{ padding: 18 }}>
        <Field label="Accountability partner (optional)">
          <TextInput style={styles.input} value={profile.buddy || ''}
                     onChangeText={(v) => patchProfile({ buddy: v })} placeholder="Their name"
                     placeholderTextColor={T.muted} />
        </Field>
        <Text style={{ fontSize: 13, color: T.muted }}>
          Roughly once a week, Today offers to share a short progress summary. You choose each time.
        </Text>
      </Card>

      <Card style={{ padding: 18 }}>
        <Field label="Community name (optional)">
          <TextInput style={styles.input} value={profile.handle || ''} maxLength={24}
                     onChangeText={(v) => patchProfile({ handle: v })} placeholder="How you'll appear in the Grove"
                     placeholderTextColor={T.muted} />
        </Field>
      </Card>

      <Card style={{ padding: 18 }}>
        <Eyebrow style={{ marginBottom: 10 }}>Prototype tools</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button tone="quiet" onPress={seed} disabled={goals.every((g) => !g.habits.length)}>
            Fill six weeks
          </Button>
          <Button tone="bare" onPress={onReset}>Start over</Button>
        </View>
      </Card>
    </View>
  );
}

/* ------------------------------ app ------------------------------- */

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);
  const [begun, setBegun] = useState(false);
  const [tab, setTab] = useState('today');
  const [view, setView] = useState('tree');
  const [growSeed, setGrowSeed] = useState(null);
  const first = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          applyTheme(s.profile && s.profile.theme ? s.profile.theme : 'herbarium');
          s.reflections = s.reflections || {};
          s.journalEntries = s.journalEntries || [];
          s.grovePosts = s.grovePosts || [];
          s.cheered = (!s.cheered || Array.isArray(s.cheered)) ? {} : s.cheered;
          s.goals.forEach((g) => {
            g.pauses = g.pauses || [];
            g.status = g.status || 'active';
            g.journal = g.journal || 'off';
          });
          setState(s);
        }
      } catch (e) { /* nothing saved */ }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!state) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ padding: 40, color: T.muted }}>Opening your record…</Text>
      </SafeAreaView>
    );
  }

  if (!state) {
    return (
      <SafeAreaView style={styles.screen}>
        {begun
          ? <Onboarding onDone={({ profile, goal }) => {
              setState({ profile, goals: [goal], log: {}, reflections: {},
                         journalEntries: [], grovePosts: [], cheered: {} });
              setEntered(true);
            }} />
          : <Welcome state={null} onBegin={() => setBegun(true)} />}
      </SafeAreaView>
    );
  }

  if (!entered) {
    return (
      <SafeAreaView style={styles.screen}>
        <Welcome state={state} onBegin={() => setEntered(true)} />
      </SafeAreaView>
    );
  }

  const TABS = [
    { k: 'today', label: 'Today' },
    { k: 'tree', label: 'Tree' },
    { k: 'goals', label: 'Goals' },
    { k: 'grove', label: 'Grove' },
    { k: 'more', label: 'Set-up' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.logoSmall}>🌱  Rootine</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: T.rule }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.k} onPress={() => setTab(t.k)}
              style={[styles.navBtn, tab === t.k && { borderBottomColor: T.ink }]}>
              <Text style={{ color: tab === t.k ? T.ink : T.muted, fontWeight: '500', fontSize: 14 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 340 }}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {tab === 'today' && (
          <Today state={state} setState={setState}
            onGrow={(g) => {
              setState((s) => Object.assign({}, s, { goals: s.goals.map((x) =>
                x.id === g.id ? Object.assign({}, x, { status: 'done' }) : x) }));
              setGrowSeed({ domain: g.domain, title: g.title });
              setTab('goals');
            }} />
        )}

        {tab === 'tree' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[['tree', 'Tree'], ['numbers', 'Numbers'], ['journal', 'Journal']].map(([k, l]) => (
                <Chip key={k} active={view === k} onPress={() => setView(k)}>{l}</Chip>
              ))}
            </View>
            {view === 'tree' && (
              <Card style={{ padding: 10 }}>
                <Tree goals={state.goals} log={state.log} />
                <Text style={{ fontSize: 13, color: T.muted, padding: 12, lineHeight: 20 }}>
                  Branches fill as you log. Resting ones dim without losing anything; finished ones
                  settle golden into the canopy.
                </Text>
              </Card>
            )}
            {view === 'numbers' && <Numbers state={state} />}
            {view === 'journal' && <Journal state={state} setState={setState} />}
          </View>
        )}

        {tab === 'goals' && (
          <Goals state={state} setState={setState} growSeed={growSeed}
                 clearGrowSeed={() => setGrowSeed(null)} />
        )}

        {tab === 'grove' && <Grove state={state} setState={setState} />}

        {tab === 'more' && (
          <Setup state={state} setState={setState}
            onReset={() => {
              AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
              setState(null); setEntered(false); setBegun(false); setTab('today');
            }} />
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ----------------------------- styles ----------------------------- */

function buildStyles() {
  const shadow = S.cardShadow
    ? { shadowColor: '#B9A98F', shadowOpacity: 0.18, shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 }, elevation: 2 }
    : {};
  return StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: T.paper,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  logo: { fontFamily: headFont(), fontSize: 22, fontWeight: '700', color: T.ink, marginBottom: 8 },
  logoSmall: { fontFamily: headFont(), fontSize: 19, fontWeight: '700', color: T.ink },
  navBtn: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  card: Object.assign({ backgroundColor: T.card, borderWidth: S.border, borderColor: T.rule,
                        borderRadius: S.radius }, shadow),
  eyebrow: { fontSize: 10, letterSpacing: 1.2, color: T.muted, fontWeight: '700' },
  h1: { fontFamily: headFont(), fontWeight: headWeight(), fontSize: 32, color: T.ink,
        marginTop: 10, marginBottom: 16, lineHeight: 38 },
  h2: { fontFamily: headFont(), fontWeight: headWeight(), fontSize: 24, color: T.ink, marginBottom: 8 },
  sub: { fontSize: 15, color: T.muted, marginBottom: 18, lineHeight: 22 },
  body: { fontSize: 16, color: T.ink, lineHeight: 25, marginBottom: 14 },
  statBox: { borderTopWidth: S.border, borderBottomWidth: S.border, borderColor: T.rule,
             paddingVertical: 18, marginBottom: 24 },
  statValue: { fontFamily: headFont(), fontWeight: headWeight(), fontSize: 40, color: T.ink, marginTop: 4 },
  statUnit: { fontSize: 16, color: T.muted },
  quoteBox: { borderLeftWidth: 3, borderLeftColor: S.cardShadow ? DOMAINS.body.colour : T.rule,
              paddingLeft: 16, marginBottom: 30 },
  quoteText: { fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', color: T.ink, lineHeight: 25 },
  btn: { borderRadius: S.cardShadow ? S.pill : 2, paddingVertical: S.btnPadV,
         paddingHorizontal: S.cardShadow ? 22 : 18, borderWidth: S.border },
  btnSolid: Object.assign({ backgroundColor: S.cardShadow ? DOMAINS.body.colour : T.ink,
                            borderColor: S.cardShadow ? DOMAINS.body.colour : T.ink }, shadow),
  btnSolidText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnQuiet: { backgroundColor: 'transparent', borderColor: T.rule },
  btnQuietText: { color: T.ink, fontSize: 15, fontWeight: '600' },
  btnBare: { backgroundColor: 'transparent', borderColor: 'transparent' },
  btnBareText: { color: T.muted, fontSize: 15, fontWeight: '600' },
  chip: { paddingVertical: S.chipPadV, paddingHorizontal: S.chipPadH, borderRadius: S.pill, borderWidth: S.border },
  chipOn: { backgroundColor: T.ink, borderColor: T.ink },
  chipOff: { backgroundColor: S.cardShadow ? T.card : 'transparent', borderColor: T.rule },
  chipText: { fontSize: 13, color: T.ink, fontWeight: '600' },
  input: { backgroundColor: T.inputBg, borderWidth: S.border, borderColor: T.rule,
           borderRadius: S.cardShadow ? 14 : 2,
           paddingVertical: S.cardShadow ? 13 : 10, paddingHorizontal: 14, fontSize: 15, color: T.ink },
  optionRow: { borderWidth: S.border, borderRadius: S.cardShadow ? 14 : 2, padding: 14, marginBottom: 10 },
  dayCircle: { width: S.day, height: S.day, borderRadius: S.day / 2, borderWidth: S.border + 0.5,
               alignItems: 'center', justifyContent: 'center' },
  tick: { width: S.tick, height: S.tick, borderRadius: S.tick / 2, borderWidth: S.border + 0.5,
          alignItems: 'center', justifyContent: 'center' },
  reflectBtn: { flex: 1, borderWidth: S.border, borderRadius: S.cardShadow ? 14 : 2,
                paddingVertical: 12, alignItems: 'center' },
  reactPill: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: S.pill, borderWidth: S.border },
  });
}

applyTheme('herbarium');
