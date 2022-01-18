import React, {Component, PureComponent} from 'react';
import _ from 'underscore';
import Modal from 'react-modal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faCaretUp } from '@fortawesome/free-solid-svg-icons'
import { faSortAlphaDown } from '@fortawesome/free-solid-svg-icons'
import { faSortAlphaDownAlt } from '@fortawesome/free-solid-svg-icons'
import { faSortNumericDown } from '@fortawesome/free-solid-svg-icons'
import { faSortNumericDownAlt } from '@fortawesome/free-solid-svg-icons'
import { faEraser } from '@fortawesome/free-solid-svg-icons'

import MonsterClassIcon from "./MonsterClassIcon";

class SpellHeaderField extends PureComponent {

    // Render a sort button when sortOrder is not null.
    renderSortButton() {
        let icon = faCaretUp;
        switch(this.props.sortOrder) {
            case 'asc':
                icon = this.props.type === "numeric" ? faSortNumericDownAlt : faSortAlphaDownAlt;
                break;
            case 'desc':
                icon = this.props.type === "numeric" ? faSortNumericDown : faSortAlphaDown;
                break;
            default:
                return "";
        }
        return <FontAwesomeIcon icon={icon}/>;
    }

    render() {
        return (
            <div className={("monster-row-" + this.props.class_name) + (this.props.sortable ? " sortable" : "")}
                 onClick={() => { if(this.props.sortable) this.props.updateSortField(this.props.sort_name)} }
            >
                {this.props.field_name}
                {
                    this.props.sortable &&
                    <span className="sort-button">
            { this.renderSortButton() }
          </span>
                }
            </div>
        )
    }
}

// The header of the monster table (on the monster selection window).
class SpellSelectionRowHeader extends PureComponent {

    render() {

        const fields = [
            {sort_name: "", class_name: "set", field_name: "", not_sortable: true},
            {sort_name: "class", type: "alpha", class_name: "class", field_name: "Class"},
            {sort_name: "charges", type: "numeric",class_name: "family", field_name: "Charges"},
            {sort_name: "name", type: "alpha", class_name: "trait_name", field_name: "Name"},
            {sort_name: "description", type: "alpha", class_name: "trait_description", field_name: "Description"}
        ]

        return (
            <div className={"monster-selection-row monster-row-header detailed" + (this.props.sortField ? " sorted" : "")}>
                { fields.map((field, i) =>
                    <SpellHeaderField key={i}
                                      sort_name={field.sort_name}
                                      class_name={field.class_name}
                                      field_name={field.field_name}
                                      sortable={!field.not_sortable}
                                      type={field.type}
                                      sortOrder={field.sort_name === this.props.sortField ? this.props.sortOrder : null}
                                      updateSortField={this.props.updateSortField}
                    />
                )}

            </div>
        )
    }
}

class SpellSelectionRow extends Component {

    // A function for rendering a particular class (cls).
    // It will render an icon if the class is one of the 5 classes in the game,
    // otherwise it will render the full name of the class (e.g. "Rodian Master").
    renderClass(cls, fullName) {
        let c = this.props.class.toLowerCase();
        let iconedClass = c === "nature" || c === "chaos" || c === "death" || c === "sorcery" || c === "life";

        return (
            <div className={"cls-container" + (!fullName ? " center" : "")}>
                { iconedClass && <MonsterClassIcon icon={this.props.class} /> }
                <span className={"cls-full-name col-cls-" + cls.toLowerCase()}>{this.props.class}</span>
            </div>
        )
    }

    render() {
        return (
            <div className={"monster-selection-row" + (this.props.set ? " in-party" : "")}>
                <div className="monster-row-in-party">
                    { this.props.set && <span className="green-tick"><FontAwesomeIcon icon={faCheck}/></span>}
                </div>
                <div className="monster-row-class">
                    <span className="mobile-only ib"><b>Class:&nbsp;&nbsp;</b></span>{this.renderClass(this.props.class, this.props.renderFullRow)}
                </div>
                <div className="monster-row-family">
                    <span className="mobile-only ib"><b>Charges:&nbsp;</b></span>{this.props.charges}
                </div>
                <div className="monster-row-trait_name">
                    <span className="mobile-only ib"><b>Spell name:&nbsp;</b></span>{this.props.name}
                </div>
                <div className="monster-row-trait_description">
                    <span className="mobile-only ib"><b>Spell description:&nbsp;</b></span>{this.props.description}
                </div>
            </div>
        );
    }
}

/**
 * The spell selection modal. Copied from Monster
 */
class SpellSelectionModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentSpell: null,
            filteredItems: [],
            currentPage: 0,
            currentSearchTerm: "",
            appliedSearchTerm: "",
            sortField: null,
            sortOrder: null,
        }
        this.searchTimeout = null;
        this.tableRef = React.createRef();
    }

    /**
     * When the component is mounted, filter the results and set this.state accordingly.
     */
    componentDidMount() {
        this.filterResults(); // Build this.state.filteredItems
    }

    /**
     * A function that sets the currentSearchTerm to the value the user has typed in the search box.
     * 0.5s after the user has stopped typing, apply the search term.
     * @param  {Event} e The event that sparked the search change.
     */
    handleSearchChange(e) {
        window.clearTimeout(this.searchTimeout);
        this.setState({
            currentSearchTerm: e.target.value,
        }, () => {
            this.searchTimeout = window.setTimeout( () => this.applySearchTerm(), 500);
        });
    }


    /**
     * Sort the results of filteredItems based on the current sort field and sort order.
     * @param  {Array} filteredItems A list of items that have been filtered.
     * @return {Array}               The sorted filtered items.
     */
    sortResults(filteredItems) {
        const field = this.state.sortField;
        const order = this.state.sortOrder;

        function compare(a, b) {
            const sf = field.split('.')
            let af = _.get(a, sf, -1);
            let bf = _.get(b, sf, -1);
            if(af === '') af = "zzzzzzz"; // For empty strings (backer traits etc), treat them as if they were zzzz, e.g. last
            if(bf === '') bf = "zzzzzzz";

            if( af < bf ) return order === "asc" ? 1 : -1;
            if( af > bf ) return order === "asc" ? -1 : 1;
            return 0;
        }

        // Sort the filteredItems if sortField is not null
        if(this.state.sortField) return filteredItems.sort((a, b) => compare(a, b));
        return filteredItems;
    }


    /**
     * Filter items by applying the current search term to this.props.spellsList.
     * Afterwards, set this.state accordingly and scroll to the top of the table.
     */
    filterResults() {
        let searchTerm = this.state.currentSearchTerm.toLowerCase();
        let filteredItems = [];
        const items = this.props.spellsList;
        for(let item of items) {
            let searchText = item.search_text;
            if(searchText.toLowerCase().indexOf(searchTerm) !== -1) {
                filteredItems.push(item);
            }
        }
        const sortedFilteredItems = this.sortResults(filteredItems);
        const filteredItemGroups = {}; // TODO ?

        this.setState({
            currentPage: 0,
            filteredItems: sortedFilteredItems,
            filteredItemGroups: filteredItemGroups
        }, () => { if(!_.isEmpty(this.tableRef.current)) this.tableRef.current.scrollTo(0, 0) }) // Scroll to top of table once complete.
    }


    /**
     * Apply the search term and filter the results accordingly.
     */
    applySearchTerm() {
        this.setState({
            appliedSearchTerm: this.state.currentSearchTerm
        }, () => this.filterResults())
    }

    /**
     * A function to render the results count.
     * The output depends on whether *all* results are being shown,
     * or a filtered list.
     * @return {ReactComponent} A span that contains a count of the search results.
     */
    renderResultsCount() {

        let r =  <span><b>{this.state.filteredItems.length}</b> of <b>{this.props.spellsList.length}</b> results</span>;
        if(this.state.filteredItems.length === this.props.spellsList.length) {
            r = <span>all <b>{this.props.spellsList.length}</b> results</span>
        }
        let f = "";
        if(this.state.appliedSearchTerm) {
            f = " matching the current search term";
        }

        return (
            <span>Displaying {r}{f}.</span>
        )
    }


    /**
     * Go to a particular page, i.e. set currentPage = pageNum.
     * Scroll to top of table once complete.
     * @param  {Integer} pageNum The index of the page to go to.
     */
    goToPage(pageNum) {
        this.setState({
            currentPage: pageNum,
        }, () => { this.tableRef.current.scrollTo(0, 0) })
    }


    updateSortField(sortField) {
        this.setState({
            sortField: (sortField === this.state.sortField && this.state.sortOrder === "asc") ? null : sortField,
            sortOrder:
                this.state.sortField === sortField ? (
                    this.state.sortOrder === "desc" ? "asc" :
                        (
                            this.state.sortOrder === "asc" ? null : "desc"
                        )
                ) : "desc"
        }, () => this.filterResults())
    }

    /**
     * The render function
     * @return {ReactComponent} The modal content div.
     */
    render() {
        let currentSpell = (!_.isEmpty(this.props.currentSpell) && !_.isEmpty(this.props.currentSpell[this.props.spellSlotIndex])) ? this.props.currentSpell[this.props.spellSlotIndex].name : null;
        const classes = ["All", "Chaos","Death","Life","Nature","Sorcery"];

        return (
            <Modal className="modal-content modal-content-info relic-selection-modal modal-wide " overlayClassName="modal-overlay modal-overlay-info is-open" isOpen={this.props.modalIsOpen}>
                <div className="modal-header">
                    <h3>Select a spell. <span style={{'marginLeft': '20px'}}>{currentSpell && ("Current: " + currentSpell)}</span></h3>
                    {(!_.isEmpty(this.props.currentSpell) && !_.isEmpty(this.props.currentSpell[this.props.spellSlotIndex])) &&
                        <button aria-label="Clear this spell slot" onClick={() => this.props.updateSpell(false, this.props.spellSlotIndex)}><FontAwesomeIcon icon={faEraser} /> Clear this spell slot</button>}
                    <button id="close-modal" className="modal-close" aria-label="Close spell selection" onClick={this.props.closeModal}><FontAwesomeIcon icon={faTimes} /></button>

                </div>

                <div className="monster-selection-modal">
                    <div className="monster-selection-controls">
                        <div className="monster-selection-search-tools">
                            <input id="monster-search" className="monster-search" autoFocus type="text" placeholder="Search spells..." onChange={(e) => this.handleSearchChange(e)} value={this.state.currentSearchTerm} />
                        </div>
                        <div className="monster-selection-pagination">
                            {classes.map((classn, i) =>
                                <div role="button" key={i} onClick={() => this.goToPage(i)}
                                     className={"tab" + (this.state.currentPage === i ? " active" : "")}>
                                    {classn}
                                </div>
                            )}
                        </div>
                        <div className="mobile-hidden monster-row-container monster-row-container-selection monster-row-container-header">
                            <SpellSelectionRowHeader sortField={this.state.sortField} sortOrder={this.state.sortOrder} updateSortField={this.updateSortField.bind(this)} />
                        </div>
                    </div>

                    <div className="monster-selection-table monster-list" ref={this.tableRef}>
                        {this.state.filteredItems.filter(spell => this.state.currentPage === 0 || spell.class === classes[this.state.currentPage]).map((monsterRow, i) =>
                            <div className={"monster-row-container monster-row-container-selection selectable" +
                                ((monsterRow && (!_.isEmpty(this.props.currentSpell) && !_.isEmpty(this.props.currentSpell[this.props.spellSlotIndex])) && this.props.currentSpell[this.props.spellSlotIndex] && (monsterRow.uid === this.props.currentSpell[this.props.spellSlotIndex].uid)) ? " currently-selected-monster" : "")}
                                 key={i}
                                 onMouseUp={() => this.props.updateSpell(monsterRow, this.props.spellSlotIndex)}>
                                <SpellSelectionRow {...monsterRow}
                                                   renderFullRow={true}
                                                   set={monsterRow && (!_.isEmpty(this.props.currentSpell) && !_.isEmpty(this.props.currentSpell[this.props.spellSlotIndex])) && this.props.currentSpell[this.props.spellSlotIndex] && (monsterRow.uid === this.props.currentSpell[this.props.spellSlotIndex].uid)}
                                                   searchTerm={this.state.currentSearchTerm}
                                />
                            </div>
                        )}
                    </div>
                    <div className="monster-selection-results-count">
                        { this.renderResultsCount() }
                    </div>
                </div>
            </Modal>
        )
    }
}

export default SpellSelectionModal;