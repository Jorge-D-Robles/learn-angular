# Minigame: Deep Space Radio

## Summary

| Field               | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| Number              | 10                                                               |
| Angular Topic       | HTTP Client & Interceptors                                       |
| Curriculum Chapters | Ch 30-31 (HTTP Client, Interceptors)                             |
| Core Mechanic       | Message management — configure HTTP calls and interceptor chains |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss                           |
| Total Levels        | 18                                                               |

## Concept

The player manages the station's deep space radio, configuring HTTP requests to communicate with Mission Control. Messages must be properly configured (method, URL, headers, body) and pass through an interceptor chain (auth, logging, retry, error handling) before transmission. The player builds both the requests and the interceptor pipeline.

## Station Narrative

The station's **Deep Space Radio** is the only link to Mission Control. The player must configure the communications system to send and receive messages correctly. Interceptors act as communication protocols that modify, log, and protect messages in transit.

## Gameplay

### Core Mechanic

- **Request builder:** Configure HTTP requests (GET, POST, PUT, DELETE) with URL, headers, and body
- **Interceptor chain:** Drag interceptor blocks into a pipeline that processes requests before sending
- **Transmission simulation:** Watch the request traverse the interceptor chain, transmit, and receive a response
- **Response handling:** Process the response (subscribe, error handling, type casting)

### Controls

- **Request editor** — select method, enter URL, add headers/body
- **Interceptor toolbox** — drag interceptors into the pipeline
- **Configure interceptor** — click to set interceptor behavior (e.g., auth token value)
- **Transmit** — send the request and watch it process
- **Response viewer** — see the response and verify it matches expectations

### Win/Lose Conditions

- **Win:** All messages transmitted and responses handled correctly
- **Lose:** Request fails, interceptor misconfigured, or response not handled
- **Scoring:** Correct requests + properly ordered interceptors + error handling coverage

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced | Description                      |
| ----- | ------------------ | -------------------------------- |
| 1     | HttpClient GET     | Simple GET request to fetch data |
| 2     | Typed responses    | Specify response type interface  |
| 3     | POST request       | Send data to Mission Control     |
| 4     | PUT / DELETE       | Update and delete operations     |
| 5     | Headers            | Add custom headers to requests   |
| 6     | Error handling     | catchError and error responses   |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced    | Description                                   |
| ----- | --------------------- | --------------------------------------------- |
| 7     | First interceptor     | Auth interceptor adds token to headers        |
| 8     | Logging interceptor   | Log request/response for debugging            |
| 9     | Interceptor ordering  | Order matters — auth before logging           |
| 10    | Error interceptor     | Global error handling interceptor             |
| 11    | Retry interceptor     | Retry failed requests with backoff            |
| 12    | Multiple interceptors | Full chain: auth -> logging -> retry -> error |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced              | Description                                  |
| ----- | ------------------------------- | -------------------------------------------- |
| 13    | Functional interceptors         | withInterceptors() function-based approach   |
| 14    | Request/response transformation | Modify request body, transform response      |
| 15    | Conditional interceptors        | Only apply to certain URLs/methods           |
| 16    | Caching interceptor             | Cache GET responses, invalidate on mutations |
| 17    | Full comms system               | Complete HTTP + interceptor architecture     |

### Boss Level (Level 18)

**"Mission Control Protocol"** — Configure a complete communications system: 6 different endpoint types (CRUD + search + upload), auth interceptor with token refresh, retry with exponential backoff, request caching, logging, and error handling. Must handle 8 transmission scenarios including auth failure, network timeout, and cache hit.

## Angular Concepts Covered

1. HttpClient service
2. GET, POST, PUT, DELETE methods
3. Typed responses (generics)
4. Request headers (HttpHeaders)
5. Query parameters (HttpParams)
6. Error handling (catchError, HttpErrorResponse)
7. HTTP interceptors (class-based)
8. Functional interceptors (withInterceptors)
9. Interceptor ordering
10. Request/response transformation
11. Auth token injection
12. Retry logic
13. Caching strategies

## Replay Modes

### Endless Mode

Procedurally generated communication scenarios with increasing complexity. Score: successful transmissions in a row.

### Speed Run

Fixed 10-transmission challenge. Par time: 5 minutes.

### Daily Challenge

Themed communication scenario (e.g., "Today: set up a secure channel with auth, encryption, and retry").

## Visual Design

- Deep space radio console aesthetic — dials, signal meters, transmission logs
- Request travels as a radio wave visualization through interceptor chain
- Each interceptor is a processing station the wave passes through
- Interceptors modify the wave visually (auth adds a key icon, logging adds a scroll, etc.)
- Successful transmission: response wave returns with data
- Failed transmission: static, error codes, retry animation

## Technical Notes

- HTTP requests are simulated against a mock backend (no real network calls)
- Mock backend defines endpoints with expected request format and response data
- Interceptor chain is modeled after Angular's actual HttpInterceptor pipeline
- Level data: endpoints[], interceptors[], testScenarios[], expectedResults[]
