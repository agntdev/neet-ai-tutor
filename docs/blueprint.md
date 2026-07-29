# NEET AI Tutor — Bot specification

**Archetype:** education

**Voice:** professional and encouraging — write every user-facing message, button label, error, and empty state in this voice.

AI-powered NEET UG coaching bot offering curriculum-aligned lessons, multimodal doubt resolution (image/PDF/voice), adaptive quizzes, progress tracking, and premium content access via one-time purchase. Supports Biology, Chemistry, Physics in English, Hindi, and Hinglish.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- NEET UG aspirants (15-20 years)
- High school students

## Success criteria

- User completes chapterwise mock tests with score tracking
- 50% of free-tier users upgrade to premium via in-chat purchase flow
- Weekly learning reports generated for 80% of active users

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with language selection and diagnostic test option
- **Ask Doubt** (button, actor: user, callback: doubt:submit) — Initiate multimodal doubt submission flow (image/PDF/voice)
  - inputs: image, PDF, voice note
  - outputs: stepwise solution, ASCII diagrams
- **Chapter Lessons** (button, actor: user, callback: lesson:select) — Browse structured lessons with NCERT alignment and concept explanations
- **Take Mock Test** (button, actor: user, callback: mock:test) — Access PYQs and chapterwise quizzes with detailed answer analysis

## Flows

### Onboarding
_Trigger:_ /start

1. Language selection (EN/HIN/HG)
2. Diagnostic test offer
3. Permission prompts for data collection

_Data touched:_ user profile

### Doubt Resolution
_Trigger:_ doubt:submit

1. Upload media
2. AI extracts question
3. Generate stepwise solution with diagrams
4. Send response with follow-up options

_Data touched:_ interaction, progress record

### Topic Lesson
_Trigger:_ lesson:select

1. Choose chapter/subtopic
2. Display structured lesson template
3. Save bookmarks if requested

_Data touched:_ concept, resources

### MCQ Analysis
_Trigger:_ quiz:mcq

1. Present question
2. Capture answer
3. Show correct answer with reasoning
4. Highlight tested concept and NCERT reference

_Data touched:_ assessments, progress record

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User Profile** _(retention: persistent)_ — Language preference, grade level, purchase status, and learning preferences
  - fields: language, grade, premium_access, preferred_subjects
- **Concept** _(retention: persistent)_ — Chapter structure with NCERT alignment and difficulty metadata
  - fields: chapter, subtopic, ncert_link, difficulty_level
- **Interaction** _(retention: persistent)_ — User-submitted doubts and AI-generated solutions
  - fields: original_media, extracted_question, solution_steps, timestamp
- **Progress Record** _(retention: persistent)_ — Learning analytics tracking accuracy, streaks, and weak topics
  - fields: chapter_accuracy, question_history, weak_topics, last_access

## Integrations

- **Telegram** (required) — Bot API messaging and payment handling
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Admin notifications for new signups/purchases via ADMIN_CHAT_ID
- Payment verification through Telegram's built-in payment flow

## Notifications

- Admin alerts for: new premium purchases, system errors, 100+ new signups/day
- User notifications: quiz results, weekly progress reports, premium access confirmation

## Permissions & privacy

- User owns all uploaded content; files deleted after 180 days or on request
- Progress data used only for personalized learning recommendations
- No third-party data sharing without explicit consent

## Edge cases

- Handling corrupted image/PDF uploads
- Fallback text responses when voice note transcription fails
- Graceful degradation during payment API outages

## Required tests

- End-to-end mock test flow with PYQ analysis
- Multilingual doubt submission and solution generation
- Premium feature access validation after purchase

## Assumptions

- Language auto-detection works for 90% of users
- Free tier limits effectively drive premium conversions
- ASCII diagrams meet accessibility requirements
