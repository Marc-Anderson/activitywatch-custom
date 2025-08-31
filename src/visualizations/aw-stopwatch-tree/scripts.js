
// --------- Component ----------
const AwStopwatchTree = {

    name: 'aw-stopwatch-tree',

    props: {
        // Array of events like your sample:
        // { data: { label: "a > b > c", running: false }, duration: 123.45, ... }
        events: { type: Array, default: () => [] },
        // optional: change the delimiter if needed
        delimiter: { type: String, default: '>' }
    },

    data () {
        return {
            expanded: new Set(),     // which "a>b>c" paths are expanded
            showPerc: false,
            hasInitialized: false,   // track if we've done the initial auto-expansion
        };
    },

    computed: {
        // Build a flat list of category nodes, pre-order (parents before children)
        categoryHierarchy () {
            const evs = Array.isArray( this.events ) ? this.events : [];
            const delim = this.delimiter;

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
            for ( const e of evs ) {
                const label = ( e?.data?.label ?? '' ).trim();
                if ( !label ) continue;
                const parts = label.split( delim ).map( s => s.trim() ).filter( Boolean );
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

            // 5) Auto-expand all nodes with children on first load
            if ( !this.hasInitialized && flat.length > 0 ) {
                const allParents = flat.filter( n => n.children.length > 0 );
                this.expanded = new Set( allParents.map( n => n.name_pretty ) );
                this.hasInitialized = true;
            }
            applySizeSoon();

            return flat;
        },
        totalDuration () {
            // sum of depth-0 nodes
            return this.categoryHierarchy
                .filter( n => n.depth === 0 )
                .reduce( ( acc, n ) => acc + n.duration, 0 );
        }
    },

    methods: {
        toggle ( cat ) {
            if ( !cat || cat.children.length === 0 ) return;
            if ( this.expanded.has( cat.name_pretty ) ) this.expanded.delete( cat.name_pretty );
            else this.expanded.add( cat.name_pretty );
            // force reactivity for Set
            this.expanded = new Set( this.expanded );
            applySizeSoon();
        },
        parentsExpanded ( cat ) {
            if ( !cat || !cat.parent ) return true; // root
            const parentKey = cat.parent.join( '>' );
            // parent must be expanded, and all ancestors must be expanded
            const parentNode = this.getCategory( cat.parent );
            return this.expanded.has( parentKey ) && this.parentsExpanded( parentNode );
        },
        shouldShowCategory ( cat ) {
            // Always show root level (depth 0)
            if ( cat.depth === 0 ) return true;
            // For non-root: check if all parents in the chain are expanded
            return this.parentsExpanded( cat );
        },
        getCategory ( pathArr ) {
            const key = pathArr.join( '>' );
            return this.categoryHierarchy.find( n => n.name_pretty === key );
        },
        pct ( n ) {
            if ( !this.totalDuration ) return '0%';
            return `${ Math.round( ( 100 * n.duration ) / this.totalDuration ) }%`;
        },
        fmt ( n ) {
            return formatDurationFriendly( n.duration );
        }
    },
        
    template: `
        <div class="container">
            <div class="data-rows">
                <!-- row -->
                <div v-for="cat in categoryHierarchy"
                    :key="cat.name_pretty"
                    v-show="shouldShowCategory(cat)"
                    :class="{ clickable: cat.children.length > 0 }"
                    @click="toggle(cat)"
                    class="row"
                >
                    
                    <!-- row-icon section -->
                    <span
                        :style="{
                            paddingLeft: (1 * cat.depth) + 'rem'
                        }" 
                        class="row-left"
                    >

                        <!-- row icon expandable (plus icon) -->
                        <b v-if="cat.children.length > 0 && !expanded.has(cat.name_pretty)" class="row-icon expandable">
                            <svg class="fa-icon" aria-hidden="true" width="11.2" height="12.8" viewBox="0 0 448 512" focusable="false">
                                <path d="M352 240v32c0 6.6-5.4 12-12 12h-88v88c0 6.6-5.4 12-12 12h-32c-6.6 0-12-5.4-12-12v-88h-88c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h88v-88c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v88h88c6.6 0 12 5.4 12 12zM448 80v352c0 26.5-21.5 48-48 48h-352c-26.5 0-48-21.5-48-48v-352c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zM400 426v-340c0-3.3-2.7-6-6-6h-340c-3.3 0-6 2.7-6 6v340c0 3.3 2.7 6 6 6h340c3.3 0 6-2.7 6-6z"></path>
                            </svg>
                        </b>

                        <!-- row icon expandable (minus icon) -->
                        <b v-else-if="cat.children.length > 0" class="row-icon expandable">
                            <svg class="fa-icon" aria-hidden="true" width="11.2" height="12.8" viewBox="0 0 448 512" focusable="false">
                                <path d="M108 284c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h232c6.6 0 12 5.4 12 12v32c0 6.6-5.4 12-12 12h-232zM448 80v352c0 26.5-21.5 48-48 48h-352c-26.5 0-48-21.5-48-48v-352c0-26.5 21.5-48 48-48h352c26.5 0 48 21.5 48 48zM400 426v-340c0-3.3-2.7-6-6-6h-340c-3.3 0-6 2.7-6 6v340c0 3.3 2.7 6 6 6h340c3.3 0 6-2.7 6-6z"></path>
                            </svg>
                        </b>

                        <!-- row icon solid (dot icon) -->
                        <b v-else class="row-icon solid">
                            <svg class="fa-icon" aria-hidden="true" width="6.4" height="6.4" viewBox="0 0 512 512" focusable="false">
                                <path d="M256 8c137 0 248 111 248 248s-111 248-248 248-248-111-248-248 111-248 248-248z"></path>
                            </svg>
                        </b>

                        <!-- title -->
                        <span class="row-title">{{ cat.subname }}</span>
                    </span>

                    <!-- time/right -->
                    <span
                        class="row-right"
                        :style="{
                            fontSize: (0.9 - (cat.depth + 1) * 0.1) + 'rem',  // decrease with depth
                            opacity: (1 - (cat.depth + 1) * 0.2)  // fade out as depth increases
                        }" 
                    >
                        <span v-if="showPerc" class="row-value-percent">{{ pct(cat) }}</span>
                        <span v-else class="row-value">{{ fmt(cat) }}</span>
                    </span>
                </div>
            </div>
            <hr />
            <div class="controls">
                <label><input type="checkbox" v-model="showPerc" /> Show percent</label>
                <span class="row-value">{{ fmt({ duration: totalDuration }) }}</span>
            </div>
        </div>
    `};

// --------- App bootstrapping ----------
const app = Vue.createApp( {
    components: { AwStopwatchTree },
    data () {
        return {
            events: [] // filled below
        };
    },
    async mounted () {
        // if AW client is reachable, use it; otherwise use sample data
        let data = [];
        try {
            // data = await queryActivityWatchData();
            data = eventData;
        } catch ( _ ) { }

        if ( !Array.isArray( data ) || data.length === 0 ) {
            // Fallback to your sample stopwatch_data
            data = [ {
                "data": { "label": "No Tasks", "running": false },
                "duration": 0.01, "id": 50745, "timestamp": "2025-08-20T23:28:22.409000+00:00"
            }];
        }

        // Normalize (guard: sometimes labels might be missing/blank)
        this.events = data.filter( e => e?.data?.label && Number.isFinite( +e.duration ) );
    }
} );


function renderVisualization (eventData) {
    // const aggSorted = aggregateEventsByLabel( eventData );
    // const slices = limitEventGroupCountsAddExcessToOther( aggSorted, 12 ); // cap; rest -> Other
    // renderPieChart( slices );
    // renderBarChart( slices );
    app.mount( '#viz-container' );
}
