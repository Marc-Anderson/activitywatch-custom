// const data = [
//   {
//     "data": {
//       "label": "operations > shipping",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70000,
//     "timestamp": "2025-08-25T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70001,
//     "timestamp": "2025-08-25T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "customer care > emails",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70002,
//     "timestamp": "2025-08-25T13:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > temu",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70003,
//     "timestamp": "2025-08-25T15:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70004,
//     "timestamp": "2025-08-26T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70005,
//     "timestamp": "2025-08-26T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "operations > shipping",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70006,
//     "timestamp": "2025-08-27T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70007,
//     "timestamp": "2025-08-27T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "customer care > emails",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70008,
//     "timestamp": "2025-08-27T13:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70009,
//     "timestamp": "2025-08-28T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "customer care > emails",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70010,
//     "timestamp": "2025-08-28T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "operations > shipping",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70011,
//     "timestamp": "2025-08-28T13:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "marketing > reports",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70012,
//     "timestamp": "2025-08-29T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "operations > shipping",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70013,
//     "timestamp": "2025-08-29T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > admin",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70014,
//     "timestamp": "2025-08-29T13:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "operations > packing",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70015,
//     "timestamp": "2025-08-30T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > admin",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70016,
//     "timestamp": "2025-08-30T11:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > admin",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70017,
//     "timestamp": "2025-08-30T13:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > admin",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70018,
//     "timestamp": "2025-08-30T15:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "operations > packing",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70019,
//     "timestamp": "2025-08-31T09:00:00+00:00"
//   },
//   {
//     "data": {
//       "label": "other > temu",
//       "running": false
//     },
//     "duration": 3600,
//     "id": 70020,
//     "timestamp": "2025-08-31T11:00:00+00:00"
//   }
// ];

// --- CONFIGURATION ---


const DAYS_OF_WEEK = [ 'M', 'T', 'W', 'T', 'F', 'S', 'S' ]; // Start on Monday, single letters

// --- CONFIG ---
// Change this whenever you like; e.g., 6 for 6am, 8 for 8am.
// You can also pass an override to renderCalendar({ startHour: 8 })
let CALENDAR_OPTIONS = {
    startHour: 0,        // default view starts at 6am
    visibleHours: 24     // keep a full 24h canvas but rotated to start at startHour
};

// --- UTILITY FUNCTIONS ---


/**
 * Handles window resize to update calendar layout
 */
function handleResize () {
    // Recalculate and update event positions if needed
    renderCalendar(); // reuses last CALENDAR_OPTIONS
}

/** Convert 0-23 to "12am/1am/.../12pm/1pm/..." */
function formatHoursFriendly ( h ) {
    const hour = ( ( h % 24 ) + 24 ) % 24;
    const label = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 ? 'am' : 'pm';
    return `${ label }${ suffix }`;
}

/** Map minutes since midnight to % from top, rotated by startHour */
function minutesToTopPercent ( totalMinutes, startHour ) {
    const DAY = 24 * 60;
    const startOffset = startHour * 60;
    const shifted = ( totalMinutes - startOffset + DAY ) % DAY; // rotate day
    return ( shifted / DAY ) * 100;
}

// 2) Helpers for clipping to the visible window
function clamp ( n, min, max ) { return Math.min( Math.max( n, min ), max ); }

// minutes -> % within the visible window (no wrap)
function minutesToTopPercentInWindow ( totalMinutes, startHour, visibleHours ) {
    const VISIBLE_TOTAL = visibleHours * 60;
    const windowStart = startHour * 60;
    const rel = totalMinutes - windowStart;               // can be < 0 or > window
    const clamped = clamp( rel, 0, VISIBLE_TOTAL );
    return ( clamped / VISIBLE_TOTAL ) * 100;
}

// --- MAIN RENDERING LOGIC ---
function renderCalendar ( options = {} ) {
    // Merge any passed options and remember them for resize re-renders
    CALENDAR_OPTIONS = { ...CALENDAR_OPTIONS, ...options };
    const { startHour, visibleHours } = CALENDAR_OPTIONS;

    const container = document.getElementById( 'calendar-container' );
    if ( !container ) {
        console.error( "Calendar container not found!" );
        return;
    }

    // If there's no data, render nothing (blank)
    if ( !Array.isArray( eventData ) || eventData.length === 0 ) {
        container.innerHTML = '';
        return;
    }

    // Helper: local date key (avoids UTC shift)
    const dateKey = ( d ) => {
        const x = new Date( d );
        x.setHours( 0, 0, 0, 0 );
        return x.toDateString();
    };

    // sort the data by timestamp
    eventData = sortEventsByTimestamp(eventData);

    // Determine if we only have one day's worth of data
    const uniqueDays = new Set( eventData.map( item => dateKey( item.timestamp ) ) );
    const isSingleDay = uniqueDays.size === 1;

    // Reference date for layouts
    const referenceDate = new Date( eventData[ 0 ].timestamp );

    // For single-day view, we pin to that day.
    // For week view, compute Monday-start week containing the referenceDate.
    const startOfWeek = new Date( referenceDate );
    // Adjust to start the week on Monday
    const day = startOfWeek.getDay();
    // if Sunday (0), go back 6 days, else go back (day-1) days
    startOfWeek.setDate( startOfWeek.getDate() - day + ( day === 0 ? -6 : 1 ) );
    startOfWeek.setHours( 0, 0, 0, 0 );
    const endOfWeek = new Date( startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 );

    // 2. Build the responsive calendar structure
    // Hour lines now start at `startHour` and span `visibleHours` rows.
    const hoursArray = Array.from( { length: visibleHours }, ( _, i ) => ( startHour + i ) % 24 );

    // Columns: 1 if single-day, else 7
    const colCount = isSingleDay ? 1 : 7;

    // Header labels
    let headerLabelsHTML;
    if ( isSingleDay ) {
        const label = referenceDate.toLocaleDateString( undefined, { weekday: 'long', month: 'short', day: 'numeric' } );
        headerLabelsHTML = `<div class="day-label">${ label }</div>`;
    } else {
        headerLabelsHTML = DAYS_OF_WEEK.map( day => `<div class="day-label">${ day }</div>` ).join( '' );
    }

    // Calendar HTML (note the inline grid-template-columns so we can do 1 or 7 columns)
    let calendarHTML = `
        <!-- Header -->
        <div class="calendar-header">
            <div class="grid" style="grid-template-columns: repeat(${ colCount }, minmax(0,1fr));">
                ${ headerLabelsHTML }
            </div>
        </div>
        
        <!-- Body -->
        <div class="calendar-body">
            <!-- Background Grid -->
            <div class="absolute inset-0 grid" style="grid-template-columns: repeat(${ colCount }, minmax(0,1fr));">
                ${ Array.from( { length: colCount } ).map( ( _, i ) =>
        `<div class="day-column"></div>`
    ).join( '' ) }
            </div>

            <!-- Hour lines (rotated start) -->
            <div class="absolute inset-0">
                ${ hoursArray.map( ( hour, i ) => {
        const top = ( i / visibleHours ) * 100; // same scale as events
        const rowH = 100 / visibleHours;
        return `<div class="hour-line absolute w-full" style="top: ${ top }%; height: ${ rowH }%;">
                        <span class="hour-label">
                            ${ formatHoursFriendly( hour ) }
                        </span>
                    </div>`;
    } ).join( '' ) }
            </div>

            <!-- Events container -->
            <div id="events-container" class="absolute inset-0"></div>
        </div>
    `;
    container.innerHTML = calendarHTML;

    // 3. Process and place data blocks
    const eventsContainer = document.getElementById( 'events-container' );


    eventData.forEach( item => {
        // timestamp is the START time now
        const startDate = new Date( item.timestamp );
        // const endDate = new Date( startDate.getTime() + item.duration * 1000 );

        // Filter to displayed range:
        if ( isSingleDay ) {
            // Only render items that fall on the single reference day
            if ( dateKey( startDate ) !== dateKey( referenceDate ) ) return;
        } else {
            // Week view: only render items whose *start* falls within the week
            if ( startDate < startOfWeek || startDate >= endOfWeek ) return;
        }

        // 4) Event placement: compute top/height in the SAME visible scale + clip
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const durationMinutes = item.duration / 60;

        const windowStart = startHour * 60;
        const windowEnd = windowStart + visibleHours * 60;

        const eventStart = startMinutes;
        const eventEnd = startMinutes + durationMinutes;

        // If the event is completely outside the visible window, skip it
        if ( eventEnd <= windowStart || eventStart >= windowEnd ) return;

        // Clip to the visible window
        const clippedStart = clamp( eventStart, windowStart, windowEnd );
        const clippedEnd = clamp( eventEnd, windowStart, windowEnd );

        // Top/height relative to visible window
        const top = minutesToTopPercentInWindow( clippedStart, startHour, visibleHours );
        const height = Math.max( ( ( clippedEnd - clippedStart ) / ( visibleHours * 60 ) ) * 100, 0.5 );

        // Compute "day index" and column geometry
        let leftPct, widthPct;
        if ( isSingleDay ) {
            leftPct = 0;
            widthPct = 100;
        } else {
            // Monday=0, Sunday=6
            const dayIndex = ( startDate.getDay() + 6 ) % 7;
            leftPct = ( dayIndex / 7 ) * 100;
            widthPct = ( 1 / 7 ) * 100;
        }

        // Create element
        const eventEl = document.createElement( 'div' );
        eventEl.className = 'event-block absolute';
        eventEl.style.top = `${ top }%`;
        eventEl.style.height = `${ height }%`;
        eventEl.style.left = isSingleDay ? `0%` : `calc(${ leftPct }% + 2px)`; // Add margin
        eventEl.style.width = isSingleDay ? `91%` : `calc(${ widthPct }% - 4px)`; // Subtract margins
        eventEl.style.backgroundColor = stringHashToHslColor( item.data.label );
        // eventEl.style.border = '1px solid rgba(0,0,0,0.1)';
        eventEl.title = `${ item.data.label }\n${ ( item.duration / 3600 ).toFixed( 2 ) } hrs`;

        // Add text label if height is sufficient
        if ( height > 2.6 ) {
            const labelText = item.data.label.split( " > " ).pop();
            eventEl.innerHTML = `<div class="event-block-label truncate">${ labelText }</div>`;
        }

        eventsContainer.appendChild( eventEl );
    } );

}

function renderVisualization(data){
    // Start the calendar at 6am by default
    renderCalendar( { startHour: 7, visibleHours: 18 } );

    // Add resize listener for responsiveness (reuses last options)
    window.addEventListener( 'resize', handleResize );
}
