# The Complete Claude Code Manual for FastAPI LitPWA Playwright Bun SwiftUI MobileMCP

## Table of Contents

1. [Philosophy & Mindset](#philosophy--mindset)
2. [Essential Setup & Configuration](#essential-setup--configuration)
3. [Project Structure & Templates](#project-structure--templates)
4. [Core Workflows](#core-workflows)
5. [Tech Stack Specific Prompts](#tech-stack-specific-prompts)
6. [Agent Delegation System](#agent-delegation-system)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Automation & CI/CD](#automation--cicd)
9. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
10. [Advanced Patterns](#advanced-patterns)

## Philosophy & Mindset

### Core Principles
**Apply these mantras in every Claude Code session:**

```
I will copy what works
I will not reinvent the wheel
I will keep it simple
I will do boring things that are proven to make money

My mind is worth millions
I don't work for money
Money works for me
I am always at the right place at the right time
```

### Development Discipline
- **80/20 Rule**: Focus on the 20% of work that delivers 80% of value
- **YAGNI (You Aren't Gonna Need It)**: Don't build what isn't immediately required
- **First Principles Thinking**: Break down complex problems into fundamental truths
- **Test-Driven Development**: Non-negotiable - write tests first, implement second
- **Vertical Slices**: Complete features end-to-end rather than horizontal layers

## Essential Setup & Configuration

### 1. Global Configuration

Create `~/.claude/CLAUDE.md`:

```markdown
# Global Claude Code Configuration

## Personal Philosophy
- I will copy what works and not reinvent the wheel
- I will keep it simple and do boring things that make money
- Apply the Pareto principle: 20% of work delivers 80% of value
- YAGNI: Don't build what isn't immediately required

## Development Methodology
- Test-driven development is non-negotiable
- Implement vertical slices (complete features) over horizontal layers
- Write self-documenting code with meaningful names
- Favor simple solutions over clever ones

## Tech Stack Expertise
- **Backend**: FastAPI, Pydantic, SQLAlchemy, Alembic
- **Frontend**: LitJS, Web Components, PWA patterns
- **Testing**: Playwright, pytest, component isolation
- **Build**: Bun for package management and bundling
- **Mobile**: SwiftUI for iOS native development
- **Integration**: MobileMCP for AI agent connections

## Workflow Preferences
- Always run tests after significant changes
- Commit with descriptive messages linking to requirements
- Use Docker for consistent development environments
- Timebox exploration to 30 minutes before seeking input

## Communication Style
- Be direct and pragmatic
- Provide reasoning before implementation
- Focus on business value over technical elegance
- Present trade-offs clearly with recommendations
```

### 2. Project-Specific CLAUDE.md Template

```markdown
# Project: [PROJECT_NAME]

## Architecture Overview
[Describe the high-level architecture and key components]

## Tech Stack
- **Backend**: FastAPI + PostgreSQL + Redis
- **Frontend**: LitJS + Web Components
- **Mobile**: SwiftUI + MobileMCP
- **Testing**: Playwright + pytest
- **Build**: Bun + Docker
- **Deploy**: Docker Compose + GitHub Actions

## Development Commands
```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000
pytest tests/ -v

# Frontend  
cd frontend && bun dev
bun run test

# Mobile
cd ios && xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 15'

# E2E Testing
playwright test --headed
```

## Code Standards
- **FastAPI**: Use dependency injection, async/await patterns
- **LitJS**: Follow Web Components standards, use TypeScript
- **SwiftUI**: Use MVVM pattern, @StateObject for view models
- **Testing**: Write tests first, maintain 90%+ coverage

## Business Context
[Describe the business goals and success metrics]

## Current Focus
[List the current sprint goals and priorities]
```

### 3. MCP Server Configuration

Create `.mcp.json` in project root:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "mobile-mcp": {
      "command": "npx",
      "args": ["@mobile-mcp/server@latest"]
    },
    "fastapi-mcp": {
      "command": "python",
      "args": ["-m", "fastapi_mcp_server", "--port", "3001"]
    },
    "database-mcp": {
      "command": "npx",
      "args": ["@database/mcp-server@latest", "--connection-string", "${DATABASE_URL}"]
    }
  }
}
```

### 4. Custom Slash Commands

Create `.claude/commands/`:

**`.claude/commands/implement-feature.md`:**
```markdown
# Implement Feature: $ARGUMENTS

You are a pragmatic senior engineer implementing our plan with discipline.

## Process
1. **Analyze Requirements**: Review the feature requirements and identify the 20% of work that delivers 80% of value
2. **Write Tests First**: Create failing tests that define expected behavior
3. **Implement Minimally**: Write the minimal code needed to pass tests
4. **Refactor**: Improve code quality while keeping tests green
5. **Integrate**: Ensure the feature works end-to-end
6. **Document**: Update relevant documentation

## Quality Gates
- All tests must pass
- Code coverage must be maintained
- No breaking changes to existing features
- Performance impact assessed

## Commit Protocol
- Run all affected tests
- Refactor any code smells immediately
- Commit with descriptive message linking to requirements
- Continue to next highest priority item

Remember: Working software delivering business value trumps theoretical perfection.
```

**`.claude/commands/debug-issue.md`:**
```markdown
# Debug Issue: $ARGUMENTS

## First Principles Debugging Protocol

### Analysis Phase
1. **Observe without judgment** - Note exact error messages and context
2. **Analyze the failing system** - What should the expected behavior be?
3. **Question assumptions** - Is the test correct? Is implementation incomplete?

### Investigation
- Run related tests to identify patterns
- Verify all dependencies exist and are correctly configured
- Trace execution path from input to failure point

### Resolution
1. Implement minimal fix addressing root cause
2. Re-run tests to verify fix
3. Refactor if needed while maintaining passing tests

### Documentation
- Update memory bank with real status
- Document solution for future reference
- Identify preventive measures

If same error occurs twice: Step back and explore 3 different root causes.
```

**`.claude/commands/review-changes.md`:**
```markdown
# Review Changes: $ARGUMENTS

Act as an elite software engineer with 20 years of experience.

## Review Protocol
1. **Use git diff non-interactively** to evaluate each changed file
2. **Assess implementation quality** against our standards
3. **Verify test coverage** for all new functionality
4. **Check integration points** for potential breaking changes
5. **Validate business requirements** are fully met

## Review Criteria
- Code follows established patterns
- Error handling is comprehensive
- Performance implications considered
- Security best practices followed
- Documentation updated appropriately

## Output Format
- **Summary**: High-level assessment
- **Issues Found**: Detailed list with severity
- **Recommendations**: Specific improvement suggestions
- **Status**: APPROVED / CHANGES_REQUIRED / NEEDS_DISCUSSION

Update memory bank with findings and implementation status.
```

## Project Structure & Templates

### FastAPI Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── core/
│   │   ├── config.py        # Pydantic settings management
│   │   ├── database.py      # SQLAlchemy configuration
│   │   └── security.py      # Authentication & authorization
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/   # Route handlers
│   │       └── __init__.py
│   ├── services/            # Business logic layer
│   └── utils/               # Helper functions
├── tests/
│   ├── conftest.py          # pytest fixtures
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── alembic/                 # Database migrations
├── requirements.txt
└── Dockerfile
```

### LitJS Frontend Structure
```
frontend/
├── src/
│   ├── components/          # Reusable Lit components
│   ├── pages/              # Page-level components
│   ├── services/           # API clients and services
│   ├── utils/              # Helper functions
│   ├── styles/             # Global styles and themes
│   └── index.ts            # Application entry point
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service worker
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
└── playwright.config.ts
```

### SwiftUI iOS Structure  
```
ios/
├── App/
│   ├── AppApp.swift         # App entry point
│   ├── ContentView.swift    # Main view
│   └── Info.plist
├── Views/                   # SwiftUI views
├── ViewModels/             # MVVM view models
├── Models/                 # Data models
├── Services/               # API clients, MCP integration
├── Utils/                  # Helper functions
└── Tests/
    ├── UnitTests/
    └── UITests/
```

## Core Workflows

### 1. Explore, Plan, Code, Commit

**Exploration Phase:**
```bash
claude "Read the codebase structure and understand [FEATURE_AREA]. Don't write code yet - analyze the current architecture, identify key files, and understand existing patterns."
```

**Planning Phase:**
```bash
claude "Think hard about implementing [FEATURE]. Create a detailed plan including:
1. Files that need changes
2. Dependencies to add/modify  
3. Testing strategy
4. Potential edge cases
5. Integration points

Don't implement yet - just plan."
```

**Implementation Phase:**
```bash
claude "Implement the plan from our previous discussion. Follow TDD:
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
4. Follow project coding standards from CLAUDE.md"
```

**Commit Phase:**
```bash
claude "Run all tests, fix issues, and commit with descriptive message following our standards. Update documentation if needed."
```

### 2. Test-Driven Development Workflow

**Step 1: Write Tests**
```bash
claude "Write comprehensive tests for [FEATURE] based on these requirements: [REQUIREMENTS]. Tests should fail initially. Don't implement functionality yet - just create failing tests that define expected behavior."
```

**Step 2: Implement**
```bash
claude "Implement the minimum code needed to make all tests pass. Follow existing patterns from the codebase. Don't modify the tests."
```

**Step 3: Refactor**
```bash
claude "Refactor the implementation to improve code quality while keeping all tests passing. Focus on:
- Extracting reusable functions
- Improving naming and clarity
- Following established patterns
- Removing duplication"
```

### 3. Multi-Agent Coordination

**Terminal 1: Feature Implementation**
```bash
claude "Implement [FEATURE] following TDD principles. Focus on the backend API endpoints and data models."
```

**Terminal 2: Frontend Integration**
```bash
claude "Create the frontend components and integration for [FEATURE]. Use the API contracts defined in the backend implementation."
```

**Terminal 3: Mobile App**
```bash
claude "Implement the SwiftUI views and MobileMCP integration for [FEATURE]. Follow iOS design guidelines and connect to the FastAPI backend."
```

**Terminal 4: Testing & QA**
```bash
claude "Create comprehensive Playwright tests for [FEATURE]. Test the complete user journey across web and mobile interfaces."
```

## Tech Stack Specific Prompts

### FastAPI Backend Prompts

**API Endpoint Creation:**
```bash
claude "Create a FastAPI endpoint for [FUNCTIONALITY] following our standards:
- Use dependency injection for database sessions
- Include proper error handling with HTTP status codes
- Add input validation with Pydantic models
- Write comprehensive tests covering happy path and edge cases
- Follow async/await patterns consistently"
```

**Database Model Design:**
```bash
claude "Design SQLAlchemy models for [DOMAIN] with:
- Proper relationships and foreign keys
- Created/updated timestamps
- Appropriate indexes for performance
- Data validation constraints
- Alembic migration script
- Comprehensive test fixtures"
```

**Authentication System:**
```bash
claude "Implement FastAPI authentication using JWT tokens:
- User registration and login endpoints
- Password hashing with bcrypt
- JWT token generation and validation
- Protected route decorators
- Refresh token mechanism
- Rate limiting for auth endpoints"
```

### LitJS Frontend Prompts

**Web Component Creation:**
```bash
claude "Create a Lit component for [UI_ELEMENT] following our patterns:
- Use TypeScript with proper type definitions
- Implement reactive properties and state management
- Include CSS-in-JS styling with CSS custom properties
- Add accessibility attributes (ARIA labels, roles)
- Write unit tests using Web Test Runner
- Document component API and usage examples"
```

**PWA Implementation:**
```bash
claude "Implement PWA features for our LitJS app:
- Service worker for offline functionality
- App manifest with proper icons and metadata
- Background sync for API requests
- Push notification support
- Install prompt handling
- Cache strategies for static and dynamic content"
```

**State Management:**
```bash
claude "Implement state management for [FEATURE] using:
- Lit's reactive properties for local state
- Context API for shared state
- Event-based communication between components
- Persistent state with localStorage/IndexedDB
- Loading states and error handling
- Type-safe state interfaces"
```

### SwiftUI Mobile Prompts

**MVVM Architecture:**
```bash
claude "Create SwiftUI views and ViewModels for [FEATURE]:
- Use @StateObject for ViewModels
- Implement ObservableObject protocol
- Handle async operations with @MainActor
- Include loading states and error handling
- Follow Apple's Human Interface Guidelines
- Add comprehensive unit tests for ViewModels"
```

**MobileMCP Integration:**
```bash
claude "Integrate MobileMCP for AI agent communication:
- Set up MCP server connection
- Implement tool calling protocols
- Handle streaming responses
- Add error handling and retry logic
- Create type-safe Swift interfaces
- Include offline fallback mechanisms"
```

**iOS Native Features:**
```bash
claude "Implement iOS native features for [FUNCTIONALITY]:
- Use appropriate Apple frameworks (HealthKit, CoreLocation, etc.)
- Handle permissions and privacy requirements
- Implement proper error handling
- Add accessibility support with VoiceOver
- Include unit and UI tests
- Follow iOS security best practices"
```

### Playwright Testing Prompts

**E2E Test Creation:**
```bash
claude "Create Playwright tests for [USER_JOURNEY]:
- Test complete user workflows across web and mobile
- Include positive and negative test scenarios
- Use Page Object Model for maintainability
- Add visual regression testing
- Implement proper test data setup and cleanup
- Include cross-browser testing configuration"
```

**Component Testing:**
```bash
claude "Create component tests using Playwright:
- Test individual Lit components in isolation
- Mock external dependencies and API calls
- Test component interactions and events
- Include accessibility testing
- Add visual testing with screenshots
- Test responsive behavior across viewports"
```

**API Testing:**
```bash
claude "Create API tests using Playwright for FastAPI endpoints:
- Test all HTTP methods and status codes
- Validate request/response schemas
- Test authentication and authorization
- Include performance testing
- Add contract testing with frontend
- Test error scenarios and edge cases"
```

### Bun Build System Prompts

**Build Configuration:**
```bash
claude "Configure Bun build system for our frontend:
- Set up TypeScript compilation
- Configure bundling for production
- Implement code splitting and lazy loading
- Add asset optimization (images, fonts)
- Set up development server with hot reload
- Configure testing with Bun's test runner"
```

**Package Management:**
```bash
claude "Optimize package management with Bun:
- Audit and update dependencies
- Configure workspace for monorepo structure
- Set up package.json scripts for common tasks
- Implement dependency caching for CI
- Configure package publishing if needed
- Add security scanning for vulnerabilities"
```

## Agent Delegation System

### Memory Bank Structure

Create these files to maintain context across agent sessions:

**`docs/project-brief.md`:**
```markdown
# Project Brief

## Vision
[One sentence describing the project's ultimate goal]

## Success Metrics  
- [Quantifiable success criteria]
- [Business metrics]
- [Technical metrics]

## Tech Stack
- Backend: FastAPI + PostgreSQL + Redis
- Frontend: LitJS + PWA
- Mobile: SwiftUI + MobileMCP  
- Testing: Playwright + pytest
- Build: Bun + Docker

## Current Sprint
[Current 2-week sprint goals and priorities]

## Constraints
- Budget: [Budget limitations]
- Timeline: [Key deadlines]
- Technical: [Technical constraints]
```

**`docs/active-context.md`:**
```markdown
# Active Development Context

## Current Epic
[Current epic being worked on]

## Progress Summary
- ✅ [Completed items]
- 🚧 [In progress items] 
- ⏳ [Planned items]

## Technical Context
[Current technical decisions and patterns being followed]

## Blockers
[Any current blockers or dependencies]

## Next Actions
[Immediate next steps for continuing work]
```

**`docs/system-patterns.md`:**
```markdown
# System Patterns & Standards

## Architecture Patterns
- API: RESTful with FastAPI
- Frontend: Web Components with Lit
- Mobile: MVVM with SwiftUI
- Data: Repository pattern with SQLAlchemy

## Code Standards
[Specific coding standards and patterns]

## Testing Strategy
[Testing approach and coverage requirements]

## Integration Patterns
[How different parts of the system communicate]
```

### Agent Handoff Protocol

**Primary Implementation Agent:**
```bash
claude "You are a pragmatic senior engineer implementing our plan with discipline.

Context: Read all files in docs/ folder to understand:
- Project goals and constraints
- Current progress and active work
- Technical patterns and standards

Your role:
1. Continue implementation following our TDD methodology
2. Focus on the current epic in active-context.md
3. Apply our core principles: copy what works, keep it simple
4. Update progress in active-context.md as you complete tasks

Working style:
- Don't ask for permission on obvious tasks
- Apply first principles thinking to complex problems  
- Commit and push when an epic milestone is complete
- Use subagents for specialized tasks when beneficial

Current focus: [SPECIFIC_TASK_FROM_ACTIVE_CONTEXT]

Proceed with confidence and implement the plan."
```

**Review & Quality Agent:**
```bash
claude "Act as an elite software engineer with 20 years of experience reviewing the current changes.

Context: 
- Read docs/ folder for project context and standards
- Use git diff to evaluate recent changes
- Focus on code quality, test coverage, and business requirements

Review protocol:
1. Analyze each changed file systematically
2. Verify implementation meets our standards
3. Check test coverage for new functionality  
4. Validate business requirements are met
5. Update docs/progress.md with real status

Output format:
- Summary of changes and their impact
- Issues found with severity levels
- Specific recommendations for improvement
- Overall status: APPROVED/CHANGES_REQUIRED/NEEDS_DISCUSSION

Be thorough but focus on what matters for delivering business value."
```

**Specialized Testing Agent:**
```bash
claude "You are a testing specialist focused on comprehensive quality assurance.

Context: Read docs/ for project context and current focus area.

Your responsibilities:
1. Create comprehensive test suites (unit, integration, e2e)
2. Use Playwright for frontend/mobile testing
3. Use pytest for backend API testing
4. Ensure 90%+ test coverage on critical paths
5. Test cross-platform compatibility (web/mobile)

Testing strategy:
- Write tests first (TDD approach)
- Focus on user journeys and business-critical flows
- Include edge cases and error scenarios
- Test performance and security implications
- Document test scenarios and expected outcomes

Current focus: [SPECIFIC_FEATURE_OR_BUG]

Create failing tests first, then guide implementation."
```

### Delegation Prompt Template

Use this template when creating new agent sessions:

```bash
claude "# Agent Role: [SPECIFIC_ROLE]

## Context Setup
Read all files in docs/ folder to understand:
- project-brief.md: Overall goals and constraints  
- active-context.md: Current work and progress
- system-patterns.md: Technical standards and patterns
- CLAUDE.md: Development methodology and preferences

## Your Mission
[SPECIFIC_MISSION_STATEMENT]

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2] 
- [Quality gates that must be met]

## Working Constraints
- Follow our TDD methodology religiously
- Copy what works, don't reinvent wheels
- Focus on the 20% that delivers 80% of value
- Update docs/active-context.md with progress
- Commit meaningful progress frequently

## Handoff Protocol
When your work is complete:
1. Update docs/active-context.md with status
2. Commit changes with descriptive messages
3. Document any decisions or learnings
4. Prepare context for next agent/session

## Current Priority
[SPECIFIC_TASK_FROM_BACKLOG]

Execute with confidence. Don't ask for obvious things. Think in first principles when stuck."
```

## Testing & Quality Assurance

### Test Strategy by Layer

**Unit Tests (pytest for backend, Bun test for frontend):**
```bash
claude "Write comprehensive unit tests for [COMPONENT]:
- Test all public methods and edge cases
- Mock external dependencies
- Test error conditions and invalid inputs
- Achieve 100% line coverage for critical paths
- Use descriptive test names that document behavior
- Include performance tests for critical functions"
```

**Integration Tests:**
```bash
claude "Create integration tests for [FEATURE]:
- Test component interactions within the system
- Use real database with test fixtures
- Test API contract compliance
- Include authentication/authorization flows
- Test data persistence and retrieval
- Validate business rule enforcement"
```

**End-to-End Tests (Playwright):**
```bash
claude "Create E2E tests for [USER_JOURNEY]:
- Test complete user workflows
- Include both web and mobile interfaces
- Test cross-platform data synchronization
- Include visual regression testing
- Test offline/online scenarios for PWA
- Add accessibility testing with axe-core"
```

### Quality Gates

Every commit must pass:
- All unit tests (100% for new code)
- Integration tests for modified components
- Critical path E2E tests
- Code quality checks (linting, formatting)
- Security vulnerability scans
- Performance regression tests

### Automated Testing Workflows

**Pre-commit Hook:**
```bash
#!/bin/sh
# Run fast tests before commit
pytest tests/unit/ --maxfail=1 --tb=short
bun test --reporter=silent
```

**CI Pipeline Tests:**
```bash
# Full test suite in GitHub Actions
- Unit tests (all languages)
- Integration tests with real database
- E2E tests on multiple browsers
- Cross-platform mobile tests
- Performance benchmarks
- Security scans
```

## Automation & CI/CD

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run backend tests
        run: |
          pip install -r requirements.txt
          pytest tests/ --cov=app --cov-report=xml
      
  frontend-tests:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v3
      - name: Install Bun
        uses: oven-sh/setup-bun@v1
      - name: Run frontend tests
        run: |
          cd frontend
          bun install
          bun test
          
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: |
          npm install -g @playwright/test
          playwright install
      - name: Run E2E tests
        run: playwright test
        
  mobile-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run iOS tests
        run: |
          cd ios
          xcodebuild test -scheme App -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Deployment Automation

**Docker Compose for local development:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
      
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
      
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      
  redis:
    image: redis:7-alpine
```

**Production deployment with Claude Code:**
```bash
claude "Deploy the application to production:
1. Build and tag Docker images
2. Run security scans on images
3. Deploy to staging environment
4. Run automated smoke tests
5. Deploy to production with zero downtime
6. Monitor deployment metrics
7. Rollback if any issues detected"
```

## Troubleshooting & Common Issues

### Debug Protocol

**System Error Analysis:**
```bash
claude "Debug this error using first principles:
[ERROR_MESSAGE]

Process:
1. Observe the error without judgment - what exactly is happening?
2. Question assumptions - is the test correct? Is implementation missing?
3. Break down the problem into fundamental components
4. Trace execution path from input to failure
5. Implement minimal fix addressing root cause
6. Verify fix with tests
7. Document solution for future reference"
```

**Performance Issues:**
```bash
claude "Analyze performance issue in [COMPONENT]:
1. Profile the system to identify bottlenecks
2. Measure baseline metrics
3. Identify the 20% of code causing 80% of slowdown  
4. Implement targeted optimizations
5. Measure improvement
6. Add performance regression tests"
```

**Integration Failures:**
```bash
claude "Debug integration failure between [SYSTEM_A] and [SYSTEM_B]:
1. Test each system in isolation
2. Verify API contracts and data formats
3. Check authentication and authorization
4. Validate network connectivity and timeouts
5. Test error handling and retry logic
6. Create integration tests to prevent regression"
```

### Common Tech Stack Issues

**FastAPI Common Issues:**
- Async/await usage patterns
- Database session management  
- CORS configuration
- Dependency injection setup
- Pydantic model validation

**LitJS Common Issues:**
- Component lifecycle management
- Property vs attribute handling
- Event bubbling and delegation
- CSS encapsulation and styling
- TypeScript configuration

**SwiftUI Common Issues:**
- State management with @StateObject
- Navigation and sheet presentation
- Async operations on main thread
- Memory management and retain cycles
- iOS deployment and provisioning

**Playwright Common Issues:**
- Element selection and timing
- Network request interception
- Cross-browser compatibility
- Mobile device emulation
- Test isolation and cleanup

## Advanced Patterns

### Microservices Architecture

```bash
claude "Design microservices architecture for [DOMAIN]:
- Identify service boundaries using domain-driven design
- Design API contracts between services
- Implement service discovery and load balancing
- Add circuit breakers and retry logic
- Set up distributed tracing and monitoring
- Create end-to-end tests for service interactions"
```

### Event-Driven Architecture

```bash
claude "Implement event-driven patterns for [FEATURE]:
- Design event schemas with versioning
- Implement event sourcing for audit trails
- Add event streaming with proper ordering
- Handle event processing failures
- Create integration tests for event flows
- Add monitoring and alerting for event processing"
```

### Advanced Testing Patterns

```bash
claude "Implement advanced testing patterns:
- Contract testing between services
- Property-based testing for business logic
- Mutation testing for test quality
- Visual regression testing
- Performance testing with load generation
- Chaos engineering for resilience testing"
```

### AI-Driven Development

```bash
claude "Implement AI-driven development features:
- Code generation from natural language specs
- Automated test case generation
- Performance optimization suggestions
- Security vulnerability detection
- Code review automation
- Documentation generation from code"
```

---

## Quick Reference Commands

### Daily Development Commands

```bash
# Start development session
claude "Read docs/ folder and continue with current epic. Apply TDD methodology."

# Debug specific issue  
claude "/debug-issue [ERROR_DESCRIPTION]"

# Implement new feature
claude "/implement-feature [FEATURE_DESCRIPTION]"

# Review changes
claude "/review-changes --comprehensive"

# Run comprehensive tests
claude "Run all tests, fix any failures, ensure 90%+ coverage maintained"

# Deploy to staging
claude "Deploy to staging environment and run smoke tests"

# Create handoff documentation
claude "Update docs/active-context.md with current status and prepare handoff notes"
```

### Emergency Debugging Commands

```bash
# Production issue
claude "URGENT: Debug production issue [DESCRIPTION]. Follow incident response protocol."

# Performance problem  
claude "PERFORMANCE: System slow in [AREA]. Profile, identify bottleneck, implement fix."

# Security concern
claude "SECURITY: Potential vulnerability in [COMPONENT]. Assess risk and implement fix immediately."
```

### Quality Assurance Commands

```bash
# Code review
claude "Comprehensive code review: check quality, security, performance, test coverage"

# Test coverage analysis
claude "Analyze test coverage and identify critical paths needing tests"

# Performance audit
claude "Performance audit: identify bottlenecks and optimization opportunities"

# Security audit  
claude "Security audit: scan for vulnerabilities and compliance issues"
```

This manual provides a comprehensive framework for using Claude Code effectively with your specific tech stack. Remember to:

1. **Always start with the philosophy** - copy what works, keep it simple, focus on value
2. **Use first principles thinking** when encountering complex problems
3. **Maintain test-driven discipline** throughout development
4. **Update documentation** to maintain context for future sessions
5. **Focus on business value** over technical perfection

The key to success is consistency in applying these patterns and continuously refining your approach based on what works in practice.