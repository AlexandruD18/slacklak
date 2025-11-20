# Design Guidelines: Slacklak - Slack Clone Application

## Design Approach: Reference-Based with System Foundation

**Primary References:** Slack, Linear, Discord
**Design System Base:** Tailwind CSS with custom component library
**Rationale:** As a productivity-focused messaging platform, we prioritize clarity, efficiency, and familiar interaction patterns that users expect from professional communication tools.

## Core Design Principles

1. **Information Hierarchy:** Clear visual distinction between workspaces, channels, messages, and UI chrome
2. **Scan-ability:** Dense information presentation without overwhelming users
3. **Instant Feedback:** Real-time updates feel immediate and natural
4. **Professional Restraint:** Clean, distraction-free interface for workplace communication

## Typography System

**Font Stack:** Inter (primary), SF Pro Display (fallback), system-ui
- **Display/Headers:** font-semibold, text-2xl to text-base
- **Message Content:** font-normal, text-base, leading-relaxed
- **Sidebar/Meta:** font-medium, text-sm
- **Timestamps/Secondary:** font-normal, text-xs, opacity-70
- **Channel Names:** font-semibold, text-sm with # prefix

## Layout Architecture

**Spacing Units:** Tailwind scale - 1, 2, 3, 4, 6, 8, 12, 16 units
- **Component padding:** p-3, p-4
- **Section spacing:** space-y-2, space-y-4
- **Message gaps:** space-y-1
- **Container margins:** mx-4, my-2

**Grid Structure:**
- **3-Column Layout:** Workspace sidebar (64px) | Channel sidebar (240px) | Main content (flex-1)
- **Mobile:** Collapsible drawer navigation, full-width message area
- **Responsive breakpoints:** md: 768px, lg: 1024px, xl: 1280px

## Component Library

### Navigation & Structure

**Workspace Sidebar (Left Column - 64px wide):**
- Workspace switcher at top (48px height squares)
- Stacked workspace icons with notification badges
- Add workspace button at bottom
- Background: Distinct from main app, subtle depth

**Channel Sidebar (240px wide):**
- Header: Workspace name with dropdown (h-12)
- Search bar (h-9, rounded-md)
- Section headers: "Channels", "Direct Messages" (uppercase, text-xs, font-semibold, px-3, py-2)
- Channel list items (h-7, px-3, rounded-md on hover/active)
- Presence indicators (8px dot) for DMs
- Unread badges (right-aligned, rounded-full, text-xs)
- Add channel/DM buttons

**Message Area:**
- Channel header: Title, description, member count (h-12, border-bottom)
- Message list: Scrollable, padding px-4
- Message input: Fixed bottom, rich text editor (min-h-12, max-h-48)

### Messages

**Message Component:**
- Avatar (32px circle) on left
- Username (font-semibold, text-sm) + timestamp (text-xs, opacity-70)
- Message text (text-base, leading-relaxed, max-w-prose)
- Hover actions: Reactions, reply, options (absolute right-2)
- Thread preview: Indented, border-l-2, pl-3

**Message States:**
- Unread: Subtle highlight or left border accent
- Mention: Distinct background tint
- Editing: Border outline, inline save/cancel buttons

### Forms & Inputs

**Message Input:**
- Toolbar: Bold, italic, code, emoji, attach (h-10, border-bottom)
- Text area: Focus ring, placeholder text
- Send button: Primary action, right-aligned
- File attachments: Chip preview with remove icon

**Authentication Forms:**
- Centered card (max-w-md)
- Logo/branding at top
- Input fields: h-11, rounded-lg, border focus:ring-2
- Labels: text-sm, font-medium, mb-2
- Submit button: w-full, h-11
- Link to alternate form (login/register) at bottom

**Channel/Workspace Creation:**
- Modal overlay (max-w-lg)
- Form sections with clear labels
- Privacy toggles (public/private) with icons
- Member selection: Searchable multi-select
- Preview of channel before creation

### Interactive Elements

**Buttons:**
- Primary: font-medium, px-4, py-2, rounded-md
- Secondary: Border variant with transparent background
- Danger: For destructive actions
- Icon buttons: p-2, rounded-md, hover background

**Dropdowns:**
- Triggered by click
- Animated slide-down (transition-all duration-150)
- Shadow-lg for depth
- Options: px-3, py-2, hover background

**Presence Indicators:**
- Online: Green dot (8px)
- Away: Yellow/orange dot with hollow center
- Offline: Gray dot
- Positioned bottom-right of avatar with ring-2 ring-white

### Data Display

**User Lists:**
- Avatar (32px) + Name + Status
- Online users first, then alphabetical
- Section dividers between online/offline

**Search Results:**
- Message preview with highlighting
- Channel name + timestamp context
- Click to jump to message

**Notification Badge:**
- Red circle for unread count
- Position: top-right of avatar/channel
- Max display: "99+"

## Screen Layouts

### Authentication Pages
- Split layout on desktop: Left side with branding/imagery (40%), right side with form (60%)
- Full-width form on mobile
- Clean, minimal design with focus on the form
- Subtle gradient or pattern background

### Main Application
**Desktop (≥1024px):**
- Fixed 3-column layout
- Message area scrolls independently
- Resizable channel sidebar (240px-400px)

**Tablet (768px-1023px):**
- Collapsible workspace sidebar (overlay)
- Fixed channel sidebar
- Main content flex-1

**Mobile (<768px):**
- Bottom navigation tabs
- Hamburger menu for channels
- Full-width message view
- Swipe gestures for navigation

### Modals & Overlays
- Centered with backdrop (backdrop-blur-sm)
- Max-width constraints (md: 500px, lg: 700px)
- Slide-up animation on mobile
- Close button top-right (×)

## Real-time Interactions

**Typing Indicators:**
- Below message input in channel
- Animated ellipsis: "UserName is typing..."
- Fade in/out transition (300ms)

**Message Delivery:**
- Optimistic UI: Show immediately
- Loading state: Reduced opacity
- Sent confirmation: Small checkmark
- Failed state: Red icon with retry option

**Presence Updates:**
- Smooth transition of indicator colors (200ms)
- Subtle pulse animation for status changes

## Animations

**Use Sparingly - Essential Only:**
- Message send: Subtle slide-up (150ms)
- Sidebar toggle: Slide transition (200ms)
- Dropdown menus: Fade + slide (150ms)
- Modal appearance: Fade backdrop + scale content (200ms)
- No scroll-triggered animations
- No decorative animations

## Accessibility

- Focus indicators: ring-2 ring-offset-2
- Keyboard navigation: Tab order follows visual hierarchy
- ARIA labels for icon-only buttons
- Screen reader announcements for new messages
- High contrast mode support
- Minimum touch target: 44px × 44px

## Images

**Logo/Branding:**
- Workspace logos: 48px × 48px squares in sidebar
- User avatars: 32px circles (messages), 40px (profiles)
- Default avatars: Initials with colored background (hash email for consistent color)

**Authentication Pages:**
- Hero image/illustration on left panel (abstract collaboration theme)
- Logo at top of form (120px wide)

**Empty States:**
- Illustration for empty channel (240px × 180px)
- Illustration for no search results
- Welcome message with image when first joining workspace

All images should use lazy loading and include alt text for accessibility.