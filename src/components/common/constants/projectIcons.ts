
import type { ComponentType, CSSProperties } from 'react'
import {
  Activity, Anchor, Antenna, Archive, Atom, Award, Beaker, Bell, Binary, Blocks,
  BookOpen, Bookmark, Box, Boxes, Braces, Brain, Briefcase, Bug, Building, Calendar,
  Camera, ChartColumn, ChartLine, ChartPie, ClipboardList, Clock, Cloud, Code, Coins,
  Compass, Component, Cpu, CreditCard, Database, Dna, Feather, FileText, Files, Flag,
  FlaskConical, Folder, Gauge, Gem, GitBranch, GitMerge, GitPullRequest, Globe, Goal,
  Handshake, HardDrive, Hourglass, Image, Inbox, Kanban, Key, Layers, Lightbulb, Link,
  ListChecks, Lock, Mail, Map, Megaphone, MessageSquare, Microchip, Microscope,
  Milestone, Music, Navigation, NotebookPen, Orbit, Package, Paintbrush, Palette,
  PenTool, Percent, Radar, Receipt, RefreshCw, Repeat, Rocket, Route, Satellite,
  Server, Shapes, Shield, Sparkles, Star, Store, Target, Telescope, Terminal, Ticket,
  Timer, Trophy, TrendingUp, Users, Video, Wifi, Zap,
} from 'lucide-react'


export type ProjectIconComponent = ComponentType<{
  size?: number | string
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}>


export const PROJECT_ICON_GROUPS = [
  'Work',
  'Goals',
  'Docs',
  'Design',
  'Research',
  'Navigation',
  'Engineering',
  'Infrastructure',
  'Metrics',
  'Time',
  'People',
  'Business',
] as const
export type ProjectIconGroup = (typeof PROJECT_ICON_GROUPS)[number]

// `satisfies` (not `:`) keeps the literal key union intact for ProjectIconKey while
// still type-checking every entry's shape.
export const PROJECT_ICONS = {
  // Work & structure
  box:            { icon: Box,            label: 'Box',             group: 'Work' },
  package:        { icon: Package,        label: 'Package',         group: 'Work' },
  layers:         { icon: Layers,         label: 'Layers',          group: 'Work' },
  boxes:          { icon: Boxes,          label: 'Boxes',           group: 'Work' },
  component:      { icon: Component,      label: 'Component',       group: 'Work' },
  blocks:         { icon: Blocks,         label: 'Blocks',          group: 'Work' },
  kanban:         { icon: Kanban,         label: 'Kanban',          group: 'Work' },
  list_checks:    { icon: ListChecks,     label: 'Checklist',       group: 'Work' },
  clipboard_list: { icon: ClipboardList,  label: 'Clipboard',       group: 'Work' },
  folder:         { icon: Folder,         label: 'Folder',          group: 'Work' },
  archive:        { icon: Archive,        label: 'Archive',         group: 'Work' },
  inbox:          { icon: Inbox,          label: 'Inbox',           group: 'Work' },

  // Goals & momentum
  target:         { icon: Target,         label: 'Target',          group: 'Goals' },
  goal:           { icon: Goal,           label: 'Goal',            group: 'Goals' },
  flag:           { icon: Flag,           label: 'Flag',            group: 'Goals' },
  milestone:      { icon: Milestone,      label: 'Milestone',       group: 'Goals' },
  rocket:         { icon: Rocket,         label: 'Rocket',          group: 'Goals' },
  zap:            { icon: Zap,            label: 'Zap',             group: 'Goals' },
  sparkles:       { icon: Sparkles,       label: 'Sparkles',        group: 'Goals' },
  star:           { icon: Star,           label: 'Star',            group: 'Goals' },
  trophy:         { icon: Trophy,         label: 'Trophy',          group: 'Goals' },
  award:          { icon: Award,          label: 'Award',           group: 'Goals' },

  // Docs & writing
  file_text:      { icon: FileText,       label: 'Document',        group: 'Docs' },
  files:          { icon: Files,          label: 'Files',           group: 'Docs' },
  book_open:      { icon: BookOpen,       label: 'Handbook',        group: 'Docs' },
  notebook_pen:   { icon: NotebookPen,    label: 'Notebook',        group: 'Docs' },
  pen_tool:       { icon: PenTool,        label: 'Pen',             group: 'Docs' },
  bookmark:       { icon: Bookmark,       label: 'Bookmark',        group: 'Docs' },
  receipt:        { icon: Receipt,        label: 'Receipt',         group: 'Docs' },
  ticket:         { icon: Ticket,         label: 'Ticket',          group: 'Docs' },

  // Design & media
  palette:        { icon: Palette,        label: 'Palette',         group: 'Design' },
  paintbrush:     { icon: Paintbrush,     label: 'Paintbrush',      group: 'Design' },
  shapes:         { icon: Shapes,         label: 'Shapes',          group: 'Design' },
  feather:        { icon: Feather,        label: 'Feather',         group: 'Design' },
  image:          { icon: Image,          label: 'Image',           group: 'Design' },
  camera:         { icon: Camera,         label: 'Camera',          group: 'Design' },
  video:          { icon: Video,          label: 'Video',           group: 'Design' },
  music:          { icon: Music,          label: 'Music',           group: 'Design' },

  // Research & ideas
  lightbulb:      { icon: Lightbulb,      label: 'Idea',            group: 'Research' },
  brain:          { icon: Brain,          label: 'Brain',           group: 'Research' },
  atom:           { icon: Atom,           label: 'Atom',            group: 'Research' },
  beaker:         { icon: Beaker,         label: 'Beaker',          group: 'Research' },
  flask:          { icon: FlaskConical,   label: 'Experiment',      group: 'Research' },
  microscope:     { icon: Microscope,     label: 'Microscope',      group: 'Research' },
  telescope:      { icon: Telescope,      label: 'Telescope',       group: 'Research' },
  dna:            { icon: Dna,            label: 'DNA',             group: 'Research' },

  // Navigation & discovery
  compass:        { icon: Compass,        label: 'Compass',         group: 'Navigation' },
  map:            { icon: Map,            label: 'Map',             group: 'Navigation' },
  route:          { icon: Route,          label: 'Roadmap',         group: 'Navigation' },
  navigation:     { icon: Navigation,     label: 'Navigation',      group: 'Navigation' },
  anchor:         { icon: Anchor,         label: 'Anchor',          group: 'Navigation' },
  globe:          { icon: Globe,          label: 'Globe',           group: 'Navigation' },
  orbit:          { icon: Orbit,          label: 'Orbit',           group: 'Navigation' },
  radar:          { icon: Radar,          label: 'Radar',           group: 'Navigation' },

  // Engineering
  code:           { icon: Code,           label: 'Code',            group: 'Engineering' },
  terminal:       { icon: Terminal,       label: 'Terminal',        group: 'Engineering' },
  braces:         { icon: Braces,         label: 'Braces',          group: 'Engineering' },
  binary:         { icon: Binary,         label: 'Binary',          group: 'Engineering' },
  git_branch:     { icon: GitBranch,      label: 'Branch',          group: 'Engineering' },
  git_merge:      { icon: GitMerge,       label: 'Merge',           group: 'Engineering' },
  git_pr:         { icon: GitPullRequest, label: 'Pull request',    group: 'Engineering' },
  bug:            { icon: Bug,            label: 'Bug',             group: 'Engineering' },
  cpu:            { icon: Cpu,            label: 'CPU',             group: 'Engineering' },
  microchip:      { icon: Microchip,      label: 'Chip',            group: 'Engineering' },
  server:         { icon: Server,         label: 'Server',          group: 'Engineering' },
  database:       { icon: Database,       label: 'Database',        group: 'Engineering' },

  // Infrastructure & security
  hard_drive:     { icon: HardDrive,      label: 'Storage',         group: 'Infrastructure' },
  cloud:          { icon: Cloud,          label: 'Cloud',           group: 'Infrastructure' },
  wifi:           { icon: Wifi,           label: 'Network',         group: 'Infrastructure' },
  antenna:        { icon: Antenna,        label: 'Antenna',         group: 'Infrastructure' },
  satellite:      { icon: Satellite,      label: 'Satellite',       group: 'Infrastructure' },
  shield:         { icon: Shield,         label: 'Security',        group: 'Infrastructure' },
  lock:           { icon: Lock,           label: 'Lock',            group: 'Infrastructure' },
  key:            { icon: Key,            label: 'Key',             group: 'Infrastructure' },

  // Metrics
  gauge:          { icon: Gauge,          label: 'Gauge',           group: 'Metrics' },
  activity:       { icon: Activity,       label: 'Activity',        group: 'Metrics' },
  trending_up:    { icon: TrendingUp,     label: 'Growth',          group: 'Metrics' },
  chart_line:     { icon: ChartLine,      label: 'Line chart',      group: 'Metrics' },
  chart_pie:      { icon: ChartPie,       label: 'Pie chart',       group: 'Metrics' },
  chart_column:   { icon: ChartColumn,    label: 'Bar chart',       group: 'Metrics' },
  percent:        { icon: Percent,        label: 'Percent',         group: 'Metrics' },

  // Time & cadence
  calendar:       { icon: Calendar,       label: 'Calendar',        group: 'Time' },
  clock:          { icon: Clock,          label: 'Clock',           group: 'Time' },
  timer:          { icon: Timer,          label: 'Timer',           group: 'Time' },
  hourglass:      { icon: Hourglass,      label: 'Hourglass',       group: 'Time' },
  repeat:         { icon: Repeat,         label: 'Recurring',       group: 'Time' },
  refresh:        { icon: RefreshCw,      label: 'Refresh',         group: 'Time' },

  // People & comms
  bell:           { icon: Bell,           label: 'Bell',            group: 'People' },
  megaphone:      { icon: Megaphone,      label: 'Megaphone',       group: 'People' },
  mail:           { icon: Mail,           label: 'Mail',            group: 'People' },
  message:        { icon: MessageSquare,  label: 'Message',         group: 'People' },
  users:          { icon: Users,          label: 'Team',            group: 'People' },
  handshake:      { icon: Handshake,      label: 'Partnership',     group: 'People' },
  link:           { icon: Link,           label: 'Link',            group: 'People' },

  // Business
  briefcase:      { icon: Briefcase,      label: 'Briefcase',       group: 'Business' },
  building:       { icon: Building,       label: 'Building',        group: 'Business' },
  store:          { icon: Store,          label: 'Store',           group: 'Business' },
  credit_card:    { icon: CreditCard,     label: 'Billing',         group: 'Business' },
  coins:          { icon: Coins,          label: 'Revenue',         group: 'Business' },
  gem:            { icon: Gem,            label: 'Gem',             group: 'Business' },
} satisfies Record<
  string,
  { icon: ProjectIconComponent; label: string; group: ProjectIconGroup }
>

export type ProjectIconKey = keyof typeof PROJECT_ICONS

export const PROJECT_ICON_KEYS = Object.keys(PROJECT_ICONS) as ProjectIconKey[]

export const DEFAULT_PROJECT_ICON: ProjectIconKey = 'box'

export const PROJECT_ICON_COLORS = [
  { name: 'Grey',   hex: '#9A9CA3' },
  { name: 'Slate',  hex: '#7C8698' },
  { name: 'Indigo', hex: '#5E6AD2' },
  { name: 'Cyan',   hex: '#02B8CC' },
  { name: 'Green',  hex: '#3FA66B' },
  { name: 'Yellow', hex: '#E5C019' },
  { name: 'Orange', hex: '#EE8B3B' },
  { name: 'Tan',    hex: '#C0917D' },
  { name: 'Red',    hex: '#E5484D' },
] as const

export const DEFAULT_PROJECT_COLOR: string = PROJECT_ICON_COLORS[0].hex

export function resolveProjectIcon(icon: string | null | undefined) {
  return PROJECT_ICONS[icon as ProjectIconKey] ?? PROJECT_ICONS[DEFAULT_PROJECT_ICON]
}

/**
 * Translucent tint of a project colour, for the surface behind its icon.
 *
 * Derived rather than hand-listed as a second hex per swatch: the picker can
 * emit any colour via the custom input, so a fixed `soft` column would leave
 * those without a tint. Mixing toward `transparent` (not toward white) also
 * keeps the result correct in dark mode — it composites over whatever surface
 * sits behind it instead of always washing out to a pale pastel.
 */
export function softProjectColor(color: string | null | undefined, percent = 9): string {
  return `color-mix(in srgb, ${color || DEFAULT_PROJECT_COLOR} ${percent}%, transparent)`
}
