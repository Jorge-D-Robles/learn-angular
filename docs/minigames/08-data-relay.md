# Minigame: Data Relay

## Summary
| Field | Value |
|-------|-------|
| Number | 08 |
| Angular Topic | Pipes |
| Curriculum Chapters | Ch 20-22 (Using Pipes, Formatting, Custom Pipes) |
| Core Mechanic | Stream transformer — place pipe blocks to convert data |
| Difficulty Tiers | Basic / Intermediate / Advanced / Boss |
| Total Levels | 18 |

## Concept
Raw sensor data streams flow from left to right. The player places pipe blocks (transform nodes) in the stream to convert raw data into the required output format. For example, raw timestamp -> DatePipe -> "Mar 6, 2026". Multiple pipes can be chained. The player must select the right pipe and configure its parameters.

## Station Narrative
The station's **Sensor Relay Network** receives raw data from sensors throughout the station. Before crew can read it, the data must pass through transformation relays (pipes) that format it for human consumption.

## Gameplay

### Core Mechanic
- Data streams flow left-to-right as animated data particles
- Raw input shown on the left, required output shown on the right
- Player drags pipe blocks from a toolbox into the stream
- Each pipe block has configuration options (format strings, parameters)
- Data flows through pipes in sequence, transforming at each step
- Output must match the target format exactly

### Controls
- **Drag pipe** from toolbox into stream
- **Click pipe** to configure parameters (e.g., date format string)
- **Chain pipes** by placing multiple in sequence
- **Run** — send test data through the pipeline
- **Compare** — see actual output vs expected output

### Win/Lose Conditions
- **Win:** All test data produces correct output
- **Lose:** Output doesn't match for more than 2 test cases
- **Scoring:** Correct output + minimal pipes used + speed

## Level Progression

### Basic Tier (Levels 1-6)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 1 | UpperCasePipe | Transform text to uppercase |
| 2 | LowerCasePipe / TitleCasePipe | Case transformations |
| 3 | DatePipe | Format dates with basic format strings |
| 4 | DecimalPipe | Format numbers with digit info |
| 5 | CurrencyPipe | Format currency values |
| 6 | Multiple streams | 3 streams, each needing different pipes |

### Intermediate Tier (Levels 7-12)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 7 | Pipe parameters | DatePipe with custom format: 'yyyy-MM-dd' |
| 8 | Pipe chaining | chain: number -> currency -> uppercase |
| 9 | PercentPipe | Format decimals as percentages |
| 10 | SlicePipe | Extract portions of arrays/strings |
| 11 | AsyncPipe | Handle observable data streams |
| 12 | Mixed challenge | All built-in pipes, multiple streams |

### Advanced Tier (Levels 13-17)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 13 | Custom pipe (pure) | Build a DistancePipe (km to light-years) |
| 14 | Custom pipe with params | StatusPipe with configurable thresholds |
| 15 | Custom pipe (impure) | TimeAgoPipe that updates with time |
| 16 | Complex chains | 4+ pipes chained for multi-step transforms |
| 17 | Design challenge | Given raw data + target output, choose and configure all pipes |

### Boss Level (Level 18)
**"Full Relay Network"** — 8 data streams, each requiring different pipe chains. Mix of built-in and custom pipes. Some streams share intermediate formats. Must configure all streams correctly. Includes a custom pipe that must be designed from scratch given a transformation spec.

## Angular Concepts Covered
1. Built-in pipes: uppercase, lowercase, titlecase
2. DatePipe and format strings
3. DecimalPipe and digit info
4. CurrencyPipe
5. PercentPipe
6. SlicePipe
7. Pipe parameters
8. Pipe chaining (|)
9. AsyncPipe
10. Custom pipes (PipeTransform interface)
11. Pure vs impure pipes
12. Custom pipe parameters

## Replay Modes

### Endless Mode
Procedurally generated data streams with random raw formats and target outputs. Increasing number of streams and pipes needed.

### Speed Run
Fixed 10-stream challenge. Par time: 4 minutes.

### Daily Challenge
Themed relay puzzle (e.g., "Today: format crew manifest data — names, dates, salaries, percentages").

## Visual Design
- Data flows as glowing particles through transparent tubes
- Pipe blocks are physical transformation nodes with input/output indicators
- Data visually changes as it passes through pipes (e.g., "1234.5" becomes "$1,234.50")
- Correct output: particles match target color/shape at destination
- Wrong output: particles shatter at destination
- Pipe toolbox organized by category (text, number, date, custom)

## Technical Notes
- Pipes are applied as actual Angular pipe transforms under the hood
- Custom pipe levels provide a simplified PipeTransform editor
- Test data is multiple input/output pairs per stream
- Level data: streams[], availablePipes[], targetOutputs[], testData[]
