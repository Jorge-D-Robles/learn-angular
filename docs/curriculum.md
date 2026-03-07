# Curriculum — 34 Story Missions

Story missions are short narrative sequences that introduce an Angular concept, show it in context, and unlock the corresponding minigame. They provide the "why" and "when" for each concept; minigames handle the "how" through repetition.

## Phase 1: Foundations (Ch 1-10) — "Rebuild the Core"

The station's core systems are offline. Rebuild them one module at a time.

| Ch  | Title                           | Angular Topic                     | Narrative                                        | Unlocks Minigame             | Deps |
| --- | ------------------------------- | --------------------------------- | ------------------------------------------------ | ---------------------------- | ---- |
| 1   | Build the Emergency Shelter     | Components                        | Create your first station module from scratch    | Module Assembly              | —    |
| 2   | Wire Up Life Support            | Interpolation                     | Display live sensor data in module readouts      | Module Assembly (new levels) | Ch 1 |
| 3   | Assemble Power Core + Comms Hub | Composing Components              | Nest child modules inside parent modules         | Module Assembly (new levels) | Ch 2 |
| 4   | Alert Systems Online            | Control Flow (@if, @for, @switch) | Route alerts through conditional display logic   | Flow Commander               | Ch 3 |
| 5   | Module Configuration Panels     | Property Binding                  | Bind configuration data to module displays       | Wire Protocol                | Ch 4 |
| 6   | Crew Interaction Controls       | Event Handling                    | Respond to crew button presses and inputs        | Wire Protocol (new levels)   | Ch 5 |
| 7   | Standardized Module Cards       | Input Properties                  | Pass data into reusable module card components   | Signal Corps                 | Ch 6 |
| 8   | Distress Signal System          | Output Properties                 | Emit events from child to parent modules         | Signal Corps (new levels)    | Ch 7 |
| 9   | Progressive Module Loading      | Deferrable Views                  | Load heavy modules on demand to save power       | —                            | Ch 8 |
| 10  | Star Chart Display              | Image Optimization                | Optimize large star chart images for performance | —                            | Ch 9 |

## Phase 2: Navigation (Ch 11-13) — "Connect the Corridors"

The corridors are damaged. Rebuild the navigation system so crew can move between modules.

| Ch  | Title              | Angular Topic  | Narrative                                                     | Unlocks Minigame             | Deps  |
| --- | ------------------ | -------------- | ------------------------------------------------------------- | ---------------------------- | ----- |
| 11  | Station Map        | Enable Routing | Set up router-outlet and basic navigation                     | Corridor Runner              | Ch 10 |
| 12  | Corridor Paths     | Define Routes  | Configure route paths, parameters, and 404 "Hull Breach" page | Corridor Runner (new levels) | Ch 11 |
| 13  | Navigation Console | RouterLink     | Build the navigation UI with routerLink directives            | Corridor Runner (new levels) | Ch 12 |

## Phase 3: Data Input (Ch 14-17) — "Crew Terminals"

The crew terminals are offline. Rebuild the input systems so crew can submit reports and diagnostics.

| Ch  | Title                  | Angular Topic       | Narrative                                            | Unlocks Minigame           | Deps  |
| --- | ---------------------- | ------------------- | ---------------------------------------------------- | -------------------------- | ----- |
| 14  | Basic Crew Report      | Forms Introduction  | Build a simple template-driven form                  | Terminal Hack              | Ch 13 |
| 15  | Real-time Preview      | Form Control Values | Read and display form values as crew types           | Terminal Hack (new levels) | Ch 14 |
| 16  | Engineering Diagnostic | Reactive Forms      | Build a complex diagnostic terminal with FormBuilder | Terminal Hack (new levels) | Ch 15 |
| 17  | Data Integrity Checks  | Forms Validation    | Add validators to prevent corrupted submissions      | Terminal Hack (new levels) | Ch 16 |

## Phase 4: Shared Systems (Ch 18-19) — "The Power Grid"

Individual modules work, but they need shared services. Wire up the station's power grid.

| Ch  | Title         | Angular Topic        | Narrative                                         | Unlocks Minigame        | Deps  |
| --- | ------------- | -------------------- | ------------------------------------------------- | ----------------------- | ----- |
| 18  | Core Services | Injectable Services  | Create PowerService, CrewService, AlertService    | Power Grid              | Ch 17 |
| 19  | Wire the Grid | Dependency Injection | Inject services with inject(), understand scoping | Power Grid (new levels) | Ch 18 |

## Phase 5: Data Processing (Ch 20-22) — "Sensor Relays"

Raw sensor data is unusable. Build transformation relays to format it for crew displays.

| Ch  | Title               | Angular Topic         | Narrative                                         | Unlocks Minigame        | Deps  |
| --- | ------------------- | --------------------- | ------------------------------------------------- | ----------------------- | ----- |
| 20  | Format Sensor Data  | Using Pipes           | Use built-in pipes (date, number, currency, etc.) | Data Relay              | Ch 19 |
| 21  | Advanced Formatting | Formatting with Pipes | Pipe parameters, chaining, AsyncPipe              | Data Relay (new levels) | Ch 20 |
| 22  | Custom Sensors      | Custom Pipes          | Build DistancePipe, StatusPipe, TimeAgoPipe       | Data Relay (new levels) | Ch 21 |

## Phase 6: Advanced (Ch 23-34) — "Deep Space Operations"

The station is functional. Now upgrade it for deep space operations with advanced systems.

| Ch  | Title                      | Angular Topic          | Narrative                                            | Unlocks Minigame              | Deps  |
| --- | -------------------------- | ---------------------- | ---------------------------------------------------- | ----------------------------- | ----- |
| 23  | Sensor Network             | Creating Signals       | Create reactive signals for station telemetry        | Reactor Core                  | Ch 22 |
| 24  | Computed Readings          | Computed Signals       | Derive values from multiple signal sources           | Reactor Core (new levels)     | Ch 23 |
| 25  | Linked Sensors             | Linked Signals         | Two-way binding with linked signals                  | Reactor Core (new levels)     | Ch 24 |
| 26  | Automated Responses        | Signal Effects         | Trigger side effects when signal values change       | Reactor Core (new levels)     | Ch 25 |
| 27  | Universal Module Bays      | Content Projection     | Build flexible containers with ng-content            | —                             | Ch 26 |
| 28  | Startup/Shutdown Sequences | Lifecycle Hooks        | Manage module initialization and cleanup             | Blast Doors                   | Ch 27 |
| 29  | Behavior Protocols         | Custom Directives      | Create reusable behavior with attribute directives   | Blast Doors (new levels)      | Ch 28 |
| 30  | Mission Control Comms      | HTTP Client            | Send and receive data from Mission Control API       | Deep Space Radio              | Ch 29 |
| 31  | Comm Protocols             | Interceptors           | Add auth, logging, and retry interceptors            | Deep Space Radio (new levels) | Ch 30 |
| 32  | System Certification       | Testing                | Write unit and integration tests for station systems | System Certification          | Ch 31 |
| 33  | Station Visual Feedback    | Animations             | Add transitions and visual feedback to the UI        | —                             | Ch 32 |
| 34  | Station Hardening          | Performance & Security | Optimize performance and secure the station          | —                             | Ch 33 |

## Angular Docs Cross-Reference

Each chapter maps to content in `refs/angular/adev/src/content/`:

| Topic                | Docs Path                                                |
| -------------------- | -------------------------------------------------------- |
| Components           | `tutorials/learn-angular/` (steps 1-3)                   |
| Interpolation        | `tutorials/learn-angular/` (step 4)                      |
| Composing Components | `tutorials/learn-angular/` (step 5)                      |
| Control Flow         | `tutorials/learn-angular/` (step 6)                      |
| Property Binding     | `tutorials/learn-angular/` (step 8)                      |
| Event Handling       | `tutorials/learn-angular/` (step 9)                      |
| Input Properties     | `tutorials/learn-angular/` (step 10)                     |
| Output Properties    | `tutorials/learn-angular/` (step 11)                     |
| Deferrable Views     | `tutorials/learn-angular/` (step 12)                     |
| Image Optimization   | `tutorials/learn-angular/` (step 13)                     |
| Routing              | `guide/routing/`                                         |
| Forms                | `guide/forms/`                                           |
| Services & DI        | `guide/di/`                                              |
| Pipes                | `tutorials/learn-angular/` (steps 16-17), `guide/pipes/` |
| Signals              | `guide/signals/`                                         |
| Content Projection   | `guide/components/`                                      |
| Lifecycle            | `guide/components/`                                      |
| Directives           | `guide/directives/`                                      |
| HTTP                 | `guide/http/`                                            |
| Testing              | `guide/testing/`                                         |
| Animations           | `guide/animations/`                                      |
