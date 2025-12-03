# Slack Clone - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing from Slack's proven messaging interface with influences from Linear's clean typography and Discord's modern chat UX. This productivity-focused application prioritizes information density, scannable content, and efficient workflows over visual flair.

## Core Design Principles

1. **Information Hierarchy**: Clear visual weight progression for workspace → channels → messages
2. **Density with Breathing Room**: Pack information efficiently while maintaining readability
3. **Instant Feedback**: Visual confirmation for all real-time actions (sending, typing, presence)
4. **Persistent Navigation**: Always-visible workspace/channel structure

## Typography System

**Font Stack**: Use Inter or similar modern sans-serif via Google Fonts

- **Workspace/App Title**: Bold, 18-20px
- **Channel Names (Sidebar)**: Medium weight, 15px
- **Active Channel**: Bold, 15px  
- **Message Sender Names**: Bold, 14px
- **Message Content**: Regular, 15px
- **Timestamps**: Regular, 12px, reduced opacity
- **Input Fields**: Regular, 15px
- **Buttons/CTAs**: Medium weight, 14px

## Layout Architecture

**Three-Column Structure**:
- **Left Sidebar** (260px fixed): Workspace switcher (top), channels list, DMs, user profile (bottom)
- **Main Chat Area** (flexible): Channel header (60px fixed), message list (flex-grow), message input (bottom)
- **Right Panel** (320px, collapsible): Channel details, member list, search results

**Spacing System**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 exclusively
- Component padding: p-4 
- Section spacing: space-y-2 for tight lists, space-y-4 for separated sections
- Message bubbles: py-2 px-4
- Sidebar items: py-2 px-3

## Component Library

### Navigation Components

**Workspace Switcher**
- Compact avatar/logo (36x36px) with workspace name
- Dropdown trigger for workspace selection
- Clear active workspace indicator

**Channel List Items**
- Icon (20x20px from Lucide: Hash for public, Lock for private, User for DMs)
- Channel name truncated with ellipsis
- Unread badge (pill shape, small numeric indicator)
- Hover state: subtle fill change

**User Profile Footer**
- Avatar (32x32px), name, status indicator (8x8px dot)
- Presence states: online (filled), away (hollow), offline (gray)

### Messaging Components

**Message Block**
- Avatar (36x36px) aligned top-left
- Name + timestamp on same line
- Message content below with proper line-height (1.5)
- Hover state reveals actions (reply, emoji, more options)
- Consecutive messages from same user: hide avatar, reduced top spacing (py-1)

**Message Input**
- Multi-line textarea with toolbar
- Formatting toolbar: Bold, Italic, Strike, Code, Link, Bullet, Number
- Emoji picker trigger, file attach, send button
- @ mention autocomplete overlay
- Height expands with content (max 50vh)

**Typing Indicator**
- Small italic text below input: "User is typing..."
- Animated ellipsis

### Channel Header
- Channel name (large, bold) with icon
- Member count or topic/description
- Action buttons: Search, Member list, Details (icon buttons, 32x32px)

### Search Interface
- Prominent search bar in right panel or modal overlay
- Filters: In channel, From user, Date range
- Results grouped by channel with message previews
- Highlight matching terms

### Modals & Overlays

**Create Channel Modal**
- Centered modal (480px max-width)
- Clear heading, description
- Form fields: Name, Description, Privacy toggle (Public/Private)
- Icon selection (optional)
- Action buttons: Cancel (secondary), Create (primary)

**User Profile Modal**
- Avatar upload area (larger, 128x128px)
- Editable fields: Display name, Status message, Timezone
- Save/Cancel actions

## Layout Patterns

**Empty States**
- Centered content (max-width 400px)
- Friendly illustration placeholder or large icon (64x64px)
- Heading + supporting text
- Primary action button

**Loading States**
- Skeleton screens matching content structure
- Pulsing animation for placeholders
- Maintain layout stability (no content jumps)

## Real-Time Feedback

**Message Sending States**
1. Optimistic UI: Message appears immediately with sending indicator
2. Success: Indicator disappears, timestamp appears
3. Error: Red indicator, retry option

**Presence Indicators**
- Consistent 8x8px dot overlaid on avatars (bottom-right)
- Update without jarring transitions (fade animation)

## Responsive Behavior

**Mobile (<768px)**
- Hide left sidebar by default, show via hamburger menu
- Collapse right panel completely
- Full-width message area
- Floating action button for create/compose

**Tablet (768-1024px)**
- Show left sidebar (collapsed: icons only, 72px)
- Full message area
- Hide right panel, accessible via slide-over

## Animations

**Minimize animations** - use sparingly:
- Sidebar expand/collapse: 200ms ease
- Modal fade-in: 150ms
- Message appear: subtle slide-up (100ms)
- Hover states: instant (no transition)

## Images

**No hero images** - this is a utility application, not marketing. 

**User Avatars**:
- Circular, consistent sizes (32px, 36px, 48px, 128px contexts)
- Fallback: Initials on solid background with high contrast

**Workspace Icons**:
- Square with rounded corners (8px radius)
- 36x36px in switcher, 24x24px in compact contexts