# Design Guidelines: AI-Powered Chatbot Application

## Design Approach
**System-Based Approach** inspired by modern chat interfaces (ChatGPT, Claude, Linear) with emphasis on readability, clarity, and efficient conversation flow. This is a utility-focused application where function and usability are paramount.

---

## Layout System

### Primary Structure
- **Two-column layout**: Fixed sidebar (280px) + flexible main chat area
- Sidebar contains: session history, new chat button, settings access, user profile
- Main area: chat messages (centered, max-width 800px) + fixed input at bottom
- Mobile: Collapsible sidebar with hamburger menu, full-width chat area

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16** for consistent spacing throughout
- Component padding: p-4 or p-6
- Section gaps: gap-4 or gap-8
- Message spacing: mb-4 between message groups
- Input container: p-6 for breathing room

---

## Typography

### Font System
- **Primary**: Inter or SF Pro Display via Google Fonts
- **Monospace**: JetBrains Mono for code blocks within messages

### Hierarchy
- **Chat messages**: text-base (16px), leading-relaxed (1.625) for optimal readability
- **Usernames/timestamps**: text-sm (14px), font-medium
- **Input field**: text-base (16px)
- **Sidebar items**: text-sm (14px)
- **System messages**: text-xs (12px), uppercase tracking-wide
- **Headers**: text-xl (20px) font-semibold for session titles

---

## Component Library

### Chat Messages
- **User messages**: Right-aligned, max-width 90%, rounded-2xl bubbles with p-4
- **AI messages**: Left-aligned, full-width (within 800px container), subtle background, rounded-lg, p-4
- **Message grouping**: Group consecutive messages from same sender, show timestamp only on first message
- **Typing indicator**: Three animated dots, small rounded container, appears below last AI message

### Input Area
- **Fixed bottom position**: Sticky footer with backdrop blur effect
- **Container**: Large rounded-xl border, p-4 inner padding
- **Textarea**: Auto-expanding (min 1 row, max 6 rows), text-base
- **Send button**: Icon-only (paper plane/arrow), positioned absolute right within input
- **Character/token counter**: Small text below input, fades in when approaching limit

### Sidebar Components
- **Session list**: Scrollable area with hover states, each item shows title + timestamp
- **Active session**: Distinct visual treatment (subtle border or background)
- **New chat button**: Prominent, full-width, rounded-lg, p-3, mb-4
- **Controls section**: Bottom-fixed area with settings, clear chat, export options as icon buttons

### Action Controls
- **Message actions**: Hover to reveal: copy, regenerate, edit (icons only, small size)
- **Session controls**: Dropdown menu for rename, delete, export
- **Clear conversation**: Confirmation modal with warning text + dual action buttons

### Feedback States
- **Loading**: Skeleton screens for message history, pulsing animation
- **Streaming**: Cursor blink effect at end of streaming text
- **Error states**: Inline error messages with retry button, rounded-lg container, p-4
- **Empty state**: Centered welcome message with suggested prompts as clickable chips

### Modals & Overlays
- **Settings panel**: Slide-out from right, 400px width, close button top-right
- **Confirmation dialogs**: Centered modal, max-width 400px, rounded-xl, p-6
- **Toast notifications**: Top-right positioned, auto-dismiss, rounded-lg, p-4

---

## Responsive Behavior

### Desktop (1024px+)
- Full sidebar visible
- Chat area max-width 800px, centered
- Message actions visible on hover

### Tablet (768px - 1023px)
- Sidebar collapsible via toggle
- Chat area takes full width with side padding
- Message actions always visible (tap-friendly)

### Mobile (<768px)
- Hidden sidebar, accessible via overlay menu
- Full-width chat area (px-4)
- Simplified message actions (long-press menu)
- Input field reduces padding (p-3)

---

## Special Interactions

### Streaming Animation
- Text appears character-by-character with smooth animation
- Blinking cursor at end during active streaming
- Scroll auto-follows new content
- Pause streaming button appears during generation

### Message History
- Infinite scroll upwards to load previous messages
- Scroll-to-bottom FAB appears when user scrolls up
- Newest message auto-focused on page load

### Context Indicators
- Token count badge in input area (shows used/limit)
- Session age indicator in sidebar
- Conversation summary button (when context > threshold)

---

## Accessibility Standards
- Focus states: 2px offset ring for all interactive elements
- Keyboard navigation: Tab through messages, Cmd+K for quick actions
- ARIA labels: Clear labeling for icon buttons, status announcements for streaming
- Screen reader: Announce new messages, streaming status changes
- Contrast: Ensure text meets WCAG AA standards in all states

---

## Images
**No hero images** - This is a chat application focused on conversation. 

**Icon Usage**: Use Heroicons (outline style) via CDN for all UI icons:
- Navigation: chat bubble, cog, user circle
- Actions: paper plane, arrows, clipboard, trash
- States: exclamation triangle, check circle, information circle

---

## Performance Considerations
- Virtualize message list for long conversations (render only visible messages)
- Debounce input field for real-time features
- Lazy load sidebar session history
- Optimize re-renders during streaming with React memo