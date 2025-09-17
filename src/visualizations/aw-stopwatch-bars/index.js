// id="viz-base-iframejs">
// the iframe doesnt expose any useful styling details so we extract them
(function syncIframeBackground() {
    // the ui doesnt expose any styles to the iframe, so we have to copy them
    try {
        // identify the iframe element
        const iframeEl = window.frameElement;
        if (!iframeEl) return;
        
        // identify the owner document element
        const ownerDocumentElement = iframeEl.ownerDocument.documentElement;

        const apply = () => {
            // get the styles of the outer document
            const ownerDocumentStyles = getComputedStyle(ownerDocumentElement);
            // console.log("ownerDocumentStyles", ownerDocumentStyles);

            // identify the styles of the iframe document
            const iframeDocumentStyles = document.documentElement.style;

            // copy relevant vars
            // const styleVars = ['--aw-bg','--aw-fg','--aw-accent'];
            const styleAttributes = ['color-scheme', 'color'];
            // .aw-container
            // background-color: #1a1d24 !important;
            // border-color: #282c32 !important;

            styleAttributes.forEach(a => {
                const val = ownerDocumentStyles.getPropertyValue(a);
                if (val !== null) iframeDocumentStyles.setProperty(a, val);
                else iframeDocumentStyles.removeProperty(a);
            });
        };

        apply();

        // Re-apply if the parent changes the iframe’s styles/classes
        new MutationObserver(apply).observe(iframeEl, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // Optional: re-apply on load/resize too
        addEventListener('load', apply);
        addEventListener('resize', apply);
    } catch (e) {
        // Cross-origin? Use postMessage instead (see below).
    }
})();

// the iframe doesnt expose any useful reshaping tools so we force it to resize
function measuredContentHeight ( elementId = 'viz-container' ) {
    const element = document.getElementById( elementId );
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle( element );
    const margins = parseFloat( styles.marginTop || 0 ) + parseFloat( styles.marginBottom || 0 );
    // const wrap = document.getElementById( 'aw-pie' );
    // const wStyles = getComputedStyle( wrap );
    // const wrapPad = parseFloat( wStyles.paddingTop || 0 ) + parseFloat( wStyles.paddingBottom || 0 );
    const wrapPad = 20;
    return Math.ceil( rect.height + margins + wrapPad );
}
function setIFrameHeightPx ( targetPx ) {
    try {
        const iframe = window.frameElement;
        if ( !iframe ) return;
        const target = Math.max( 160, Math.ceil( targetPx ) );
        const cur = iframe.getBoundingClientRect().height;
        if ( Math.abs( cur - target ) <= 2 ) return;
        iframe.style.height = target + 'px';
        iframe.style.minHeight = target + 'px';
        iframe.style.width = '100%';
        iframe.style.border = '0';
        iframe.style.display = 'block';
    } catch ( e ) { /* cross-origin parent; ignore */ }
}
const applySizeSoon = () => requestAnimationFrame( () => {
    // identify the iframe element
    const iframeEl = window.frameElement;
    if (!iframeEl) return;
    setIFrameHeightPx( measuredContentHeight() );
} );
window.addEventListener('load', () => applySizeSoon());

// id="viz-base-utilities">
// format duration in hms
function formatDurationFriendly(totalSeconds, padded=false) {
    // round to whole seconds, no negatives
    const rawSeconds = Math.max( 0, Math.round( totalSeconds || 0 ) );
    // extract time portions
    const hours = Math.floor(rawSeconds / 3600);
    const minutes = Math.floor((rawSeconds % 3600) / 60);
    const seconds = Math.floor(rawSeconds % 60);
    // clean up the formats to add padding
    let hh = String(hours);
    let mm = String(minutes);
    let ss = String(seconds);
    if(padded){
        hh = String(hours).padStart(2, '0');
        mm = String(minutes).padStart(2, '0');
        ss = String(seconds).padStart(2, '0');
    }
    if (hours > 0) {
        return `${hh}h ${mm}m ${ss}s`;
    }
    return `${mm}m ${ss}s`;
}

// format time in Ham Hpm
function formatHoursFriendly(hour) {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(0);
    date.setSeconds(0);
    // return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(' AM', 'am').replace(' PM', 'pm');
}

// calculate percentage of a part relative to a whole
function calculatePercentage ( part, whole ) { return whole ? ( part / whole ) * 100 : 0; }

// aggregate events by their label
function aggregateEventsByLabel ( events ) {
    // create a map to sum durations by label
    const map = new Map();
    for ( const e of events ) {
        const label = ( e && e.data && ( e.data.label || e.data.title || e.data.app ) ) || 'Unlabeled';
        const dur = Number( e.duration || 0 );
        map.set( label, ( map.get( label ) || 0 ) + dur );
    }
    return Array.from( map.entries() )
        .map( ( [ label, duration ] ) => ( { label, duration } ) )
        .sort( ( a, b ) => b.duration - a.duration );
}

// limit the number of event groups and add excess to "Other"
function limitEventGroupCountsAddExcessToOther ( items, maxSlices ) {
    if ( items.length <= maxSlices ) return items;
    const head = items.slice( 0, maxSlices - 1 );
    const tailSum = items.slice( maxSlices - 1 ).reduce( ( acc, x ) => acc + x.duration, 0 );
    head.push( { label: 'Other', duration: tailSum } );
    return head;
    // const aggSorted = aggregateEventsByLabel( events );
    // const slices = limitEventGroupCountsAddExcessToOther( aggSorted, 12 ); // cap; rest -> Other
}

// generate a hierarchical structure from flat events
function generateCategoryHierarchy ( events, delimiter = '>' ) {
    // Build a flat list of category nodes, pre-order (parents before children)
    // Map key = path "a>b>c" -> node
    const nodeMap = new Map();

    function ensureNode ( pathArr ) {
        const key = pathArr.join( '>' );
        if ( !nodeMap.has( key ) ) {
            nodeMap.set( key, {
                name: pathArr.slice(),                  // ['a','b','c']
                name_pretty: key,                       // 'a>b>c'
                subname: pathArr[ pathArr.length - 1 ],   // 'c'
                parent: pathArr.length > 1 ? pathArr.slice( 0, -1 ) : null,
                depth: pathArr.length - 1,
                children: [],
                duration: 0
            } );
        }
        return nodeMap.get( key );
    }

    // 1) Create nodes for every prefix; accumulate duration into all ancestors
    for ( const e of events ) {
        const label = ( e?.data?.label ?? '' ).trim();
        if ( !label ) continue;
        const parts = label.split( delimiter ).map( s => s.trim() ).filter( Boolean );
        if ( !parts.length ) continue;

        // add duration to each prefix node
        for ( let i = 1; i <= parts.length; i++ ) {
            const prefix = parts.slice( 0, i );
            const node = ensureNode( prefix );
            node.duration += Number( e.duration || 0 );
        }
    }

    // 2) Build child links
    for ( const node of nodeMap.values() ) {
        if ( node.parent ) {
            const parent = ensureNode( node.parent );
            parent.children.push( node );
        }
    }

    // 3) collect roots (depth 0) and sort children by duration desc
    const roots = [];
    for ( const node of nodeMap.values() ) {
        node.children.sort( ( a, b ) => b.duration - a.duration );
        if ( node.depth === 0 ) roots.push( node );
    }
    roots.sort( ( a, b ) => b.duration - a.duration );

    // 4) pre-order flatten (parents first)
    const flat = [];
    const visit = ( n ) => { flat.push( n ); n.children.forEach( visit ); };
    roots.forEach( visit );

    return flat;
}

// sorts events by their timestamp in ascending order.
function sortEventsByTimestamp(events) {
    return events.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// generate an hsl color palette
function generateHslPalette ( n, s = 70, l = 55 ) {
    const arr = [];
    for ( let i = 0; i < n; i++ ) {
        const hue = Math.round( ( 360 * i ) / Math.max( 1, n ) );
        arr.push( `hsl(${ hue } ${ s }% ${ l }%)` );
    }
    return arr;
    // const palette = generateHslPalette( lengthOfValues );
}

// generate an hsl color based on a given string
function stringHashToHslColor(str) {
    // this allows us to dynamically assign colors without knowing all of the different options

    function fnv1aHash(str) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 0x01000193) >>> 0;
        }
        return hash;
    }

    function lameHash(str){
        // there are too many colissions with this
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    const hash = fnv1aHash(str);

    const h = hash % 360;
    return `hsl(${h}, 39%, 49%)`; // Using soft pastel colors
    // return `hsl(${h}, 42%, 47%)`; // Using soft pastel colors
    // return `hsl(${h}, 31%, 60%)`; // reminds auri of mud and flowers
    // return `hsl(${h}, 70%, 65%)`; // Using soft pastel colors
    // return `hsl(${h}, 70%, 80%)`; // Using soft pastel colors
}

function stringHashToOklchColor(str) {
    // Dynamically assign OKLCH colors based on string hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Ensure hue is positive and in [0, 360)
    const h = ((hash % 360) + 360) % 360;
    // Use fixed lightness and chroma for pastel-like colors
    // const l = 0.62; // lightness (0-1)
    // const c = 0.14; // chroma (0-0.4 typical for web)
    const l = 0.70; // lightness (0-1)
    const c = 0.11; // chroma (0-0.4 typical for web)
    return `oklch(${l} ${c} ${h})`;
}

function stringHashToColor(str){
    return stringHashToHslColor(str);
}


// // <!-- import axios so the aw client does complain -->
// // id="viz-base-axios-hack" >
// // in reality we could just use fetch instead of the aw client but its nice to have
// // small hack so aw-client (which expects a bundler) can find axios
// const exports = {};
// function require ( name ) {
//     if ( name === 'axios' ) return axios;
//     throw new Error( "Cannot find module '" + name + "'" );
// }

// // <!-- import the aw client to fetch data -->
// // id="viz-base-awclient" >
// // ======== fetch data using the activitywatch client ========
// const urlParams = new URLSearchParams( window.location.search );
// const start = urlParams.get( 'start' );
// const end = urlParams.get( 'end' );
// // 
// const client = new AWClient( 'aw-custom-viz', { baseURL: window.location.origin } );
// const DEFAULT_AWQUERY = `all_stopwatch_events = query_bucket(find_bucket("aw-stopwatch"));
//     all_afk_events = query_bucket(find_bucket("aw-watcher-afk_"));
//     deduped_flooded_afk = flood(all_afk_events);
//     filtered_afk_events = filter_keyvals(deduped_flooded_afk, "status", ["not-afk"]);
//     working_events = filter_period_intersect(all_stopwatch_events, filtered_afk_events);
//     RETURN = sort_by_timestamp(working_events);`;
// async function queryActivityWatchData (query) {
//     // query stopwatch events intersecting with not-afk
//     // note: expects ?start=...&end=... in the url
//     const ranges = ( start && end ) ? [ `${ start }/${ end }` ] : [ '' ];
//     const q = query || DEFAULT_AWQUERY;
//     try {
//         const resp = await client.query( ranges, [ q ] );
//         const events = Array.isArray( resp ) ? resp[ 0 ] : [];
//         return sortEventsByTimestamp(events);
//     } catch ( err ) {
//         console.error( 'AW query failed:', err );
//         return [];
//     }
// }