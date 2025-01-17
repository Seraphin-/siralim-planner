import React, { Component, PureComponent } from "react";
import Modal from "react-modal";
import _ from "underscore";
import {DebounceInput} from "react-debounce-input";
import ReactTooltip from "react-tooltip";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faSave } from '@fortawesome/free-solid-svg-icons'
import { faStickyNote } from '@fortawesome/free-solid-svg-icons'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import icon_attack from "../icons/attack.png";
import icon_health from "../icons/health.png";
import icon_intelligence from "../icons/intelligence.png";
import icon_defense from "../icons/defense.png";
import icon_speed from "../icons/speed.png";

import MonsterClassIcon from './MonsterClassIcon'
import getTraitErrors from '../functions/getTraitErrors';
import SpellSelectionModal from './SpellSelectionModal'

/**
 * A function for rendering a particular class (cls).
 * It will render an icon if the class is one of the 5 classes in the game,
 * otherwise it will render the full name of the class (e.g. "Rodian Master").
 * @param  {String} cls      The name of the class.
 * @return {React.Fragment}          The name of the class plus the icon.
 */
function renderClass(cls) {
  let c = cls.toLowerCase();
  let iconedClass =
    c === "nature" ||
    c === "chaos" ||
    c === "death" ||
    c === "sorcery" ||
    c === "life";

  return (
    <React.Fragment>
      {iconedClass && <MonsterClassIcon icon={cls} />}
    </React.Fragment>
  );
}

/**
 * Simple function to determine whether a given monster is actually a monster
 * or something else (backer trait etc).
 * @param  {Object}  m Monster object.
 * @return {Boolean}   Whether it is a monster/creature or not.
 */
function isMonster(m) {
  let c = m.class.toLowerCase();
  return (
    c === "nature" ||
    c === "chaos" ||
    c === "death" ||
    c === "sorcery" ||
    c === "life"
  );
}

/**
 * A class for a tooltip that appears when you hover over a monster's name in the planner.
 */
class MonsterTooltip extends Component {
  render() {
    const m = this.props.m;
    return (
      <div className="inner">
        <div>
          <MonsterPlannerCreatureSprite
            sprite_filename={m ? m.sprite_filename : null}
          />
          <MonsterPlannerCreatureStats monster_1={m} monster_2={m} />
        </div>
        <div>
          <h3>
            {renderClass(m.class)} <b>{m.creature}</b>
          </h3>
          <table>
            <tbody>
              <tr>
                <td>Family:</td>
                <td>{m.family}</td>
              </tr>
              <tr>
                <td>Source{m.sources.length > 1 ? "s" : ""}:</td>
                <td>
                  {m.sources.length > 1 ? (
                    <ul>
                      {m.sources.map((source, i) => (
                        <li key={i}>{source}</li>
                      ))}
                    </ul>
                  ) : (
                    m.sources[0]
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

/**
 * A class that corresponds to a single MonsterRow from within the Monster Planning window
 * (i.e. the 6 creatures with 3 traits each) of the Monster Selection page.
 */
class MonsterPlannerRow extends PureComponent {
  /**
   * The render function.
   * @return {React.Fragment} A row representing a trait.
   */
  render() {
    var m = this.props.monster;
    return (
      <React.Fragment>
        {isMonster(m) && (
          <ReactTooltip id={"main-tooltip-" + this.props.rowId} place="bottom">
            <MonsterTooltip m={m} />
          </ReactTooltip>
        )}

        <div className="trait-slot-creature">
          {isMonster(m) && !this.props.isArtifact ? (
            <span
              className="creature-tag"
              data-for={"main-tooltip-" + this.props.rowId}
              data-tip
              data-iscapture="true"
            >
              {renderClass(m.class)}
              <span>{m.creature}</span>
            </span>
          ) : (
            <span className="non-creature-tag">{m.creature}</span>
          )}
        </div>
        <div className="trait-slot-trait_name">
          <span className="mobile-only ib">
            <b>Trait name:&nbsp;</b>
          </span>
          {m.trait_name}
        </div>
        <div className={"trait-slot-trait_description"}>
          <span className="mobile-only ib">
            <b>Trait description:&nbsp;</b>
          </span>
          {m.trait_description}
        </div>
      </React.Fragment>
    );
  }
}

/**
 * A component that renders the creature sprite.
 */
class MonsterPlannerCreatureSprite extends PureComponent {
  /**
   * The render function
   * @return {ReactComponent} A creature sprite container with the creature sprite inside.
   */
  render() {
    return (
      <div
        className={
          "creature-sprite-container" +
          (this.props.sprite_filename ? "" : " empty")
        }
      >
        {this.props.sprite_filename && (
          <div
            className="creature-sprite"
            style={{
              backgroundImage:
                "url('/siralim-planner/" + this.props.sprite_filename + "')",
            }}
          ></div>
        )}
      </div>
    );
  }
}

/**
 * A trait slot on the Monster Planner interface.
 * This provides the functionality for dragging and dropping as well as row validation.
 * @property {Boolean} state.justUpdated Whether this component was recently updated (for highlighting).
 * @property {Timeout} justUpdatedTimeout A timeout to keep track of when this component should consider
 *                                        itself no longer just updated.
 */
class MonsterPlannerTraitSlot extends PureComponent {
  /**
   * The constructor
   * @param  {Object} props The props.
   */
  constructor(props) {
    super(props);
    this.state = {
      justUpdated: false, // set to true when the component has just been updated
      // (so that the row flashes, providing some nice visual feedback)
    };
    this.justUpdatedTimeout = null;
  }

  // If this component updated, set 'justUpdated' to true so that the row flashes for a second.

  /**
   * If this component updated, set 'justUpdated' to true so that the row flashes for a second.
   * @param  {Object} prevProps The previous props.
   * @param  {Object} prevState The previous state.
   */
  componentDidUpdate(prevProps, prevState) {
    if (
      !this.state.justUpdated &&
      !_.isEqual(prevProps.monster, this.props.monster)
    )
      this.setJustUpdated();
  }

  /**
   * Set just updated to true. When done, create a timeout to set justUpdated to false again after 1s.
   */
  setJustUpdated() {
    this.setState(
      {
        justUpdated: true,
      },
      () => {
        window.clearTimeout(this.justUpdatedTimeout);
        this.justUpdatedTimeout = window.setTimeout(
          () => this.clearJustUpdated(),
          1000
        );
      }
    );
  }

  /**
   * Set state.justUpdated to false.
   */
  clearJustUpdated() {
    this.setState({
      justUpdated: false,
    });
  }

  /**
   * Return true if this row is empty (i.e. it corresponds to a monster), else false.
   * @return {Boolean} Whether the row is empty or not.
   */
  isEmptyRow() {
    return _.isEmpty(this.props.monster);
  }

  /**
   * A special function for rendering an empty row.
   * If there was an error (such as the monster no longer existing after uploading), print that error to the row.
   * Note that this error is different from the output of getTraitErrors - it is a parsing-related error such
   * as the buildString containing a creature that no longer exists or has changed.
   * @return {ReactComponent} A div representing an empty row.
   */
  renderEmptyRow() {
    return (
      <div className="empty-row">
        {this.props.error && (
          <span className="trait-slot-error">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Error: {this.props.error}.{" "}
          </span>
        )}
        {"Click to add a" +
          (this.props.traitSlotIndex === 0
            ? " primary trait"
            : this.props.traitSlotIndex === 1
            ? " fused trait"
            : "n artifact trait")}
      </div>
    );
  }

  /**
   * The render function.
   * @return {ReactComponent} A div representing a trait slot.
   */
  render() {
    const rowErrors = getTraitErrors(
      this.props.monster,
      this.props.traitSlotIndex
    );
    const emptyRow = this.isEmptyRow();

    let rowClass = "";
    // If this monster has a class, set rowClass accordingly.
    // This allows the row to be coloured according to the creature's class.
    if (this.props.monster.class) {
      rowClass = " cls-" + this.props.monster.class.toLowerCase();
      if (this.props.traitSlotIndex === 2) rowClass = " cls-trait";
    } else {
      rowClass = " cls-empty";
    }

    return (
      <div className="trait-slot">
        <div
          className={
            "trait-slot-clickable" +
            (this.props.draggable ? " draggable" : "") +
            (rowErrors ? " invalid-row" : "") +
            (this.props.traitSlotIndex === 2 ? " artifact-slot" : "") +
            (this.state.justUpdated ? " just-updated" : "") +
            rowClass
          }
          draggable={this.props.draggable}
          onDragStart={this.props.onDragStart()}
          onDragOver={this.props.onDragOver()}
          onDrop={this.props.onDrop()}
          onMouseUp={this.props.onMouseUp}
          title={rowErrors}
        >
          {emptyRow ? (
            this.renderEmptyRow()
          ) : (
            <MonsterPlannerRow
              monster={this.props.monster}
              error={this.props.error}
              rowId={this.props.rowId}
              isArtifact={this.props.traitSlotIndex === 2}
            />
          )}
        </div>
        <div className="trait-slot-controls">
          {!emptyRow && (
            <button
              id={"remove-trait-" + (this.props.traitSlotIndex + 1)}
              className="delete-button"
              aria-label="Delete trait"
              onClick={this.props.clearPartyMember}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>
    );
  }
}

/**
 * A spell slot on the Monster Planner interface.
 * This provides the functionality for dragging and dropping.
 */
class MonsterPlannerSpellSlot extends PureComponent {
  render() {
    let cls = this.props.spell ? this.props.spell.class : "empty";
    return (
        <div className="party-member-spell-slot" onClick={this.props.onClick}
             data-tip={this.props.spell ? (this.props.spell.name + " (" + this.props.spell.class + ")") : "Empty spell slot"}>
          <div className={"cls-" + cls.toLowerCase()}
               // draggable={this.props.draggable}
               // onDragStart={this.props.onDragStart()}
               // onDragOver={this.props.onDragOver()}
               // onDrop={this.props.onDrop()}
               //
               // onMouseUp={ this.props.onMouseUp}
            >
            <div className={"cls-container"}>
              {this.props.spell ?
                  <MonsterClassIcon icon={cls} title={this.props.spell.name + " (" + this.props.spell.class + ")"} size={"lg"} />
                  : <div className="class-icon-lg spell-add-icon-fa"><FontAwesomeIcon icon={faPlus}/></div>
              }
            </div>
          </div>
        </div>
    )
  }
}


/**
 * A component representing the class of a creature, to be rendered in the monster profile.
 */
class MonsterPlannerCreatureClass extends PureComponent {
  /**
   * The render function.
   * @return {ReactComponent} A div representing the creature class.
   */
  render() {
    const monsterClass = this.props.monsterClass;
    return (
      <div className="party-member-class">
        {monsterClass !== "empty" && (
          <React.Fragment>
            <MonsterClassIcon icon={monsterClass} />
            {monsterClass}
          </React.Fragment>
        )}
        {monsterClass === "empty" && ""}
      </div>
    );
  }
}

/**
 * A component that shows the stats of a creature, to be rendered in the monster profile.
 */
class MonsterPlannerCreatureStats extends PureComponent {
  /**
   * The render function.
   * @return {ReactComponent} A div containing the monster's stats.
   */
  render() {
    let stats = {
      health: "--",
      attack: "--",
      intelligence: "--",
      defense: "--",
      speed: "--",
    };
    const m1 = this.props.monster_1.stats;
    const m2 = this.props.monster_2.stats;

    if (m1 && !m2) {
      stats.health = m1.health;
      stats.attack = m1.attack;
      stats.intelligence = m1.intelligence;
      stats.defense = m1.defense;
      stats.speed = m1.speed;
    } else if (m1 && m2) {
      stats.health = Math.floor((m1.health + m2.health) / 2);
      stats.attack = Math.floor((m1.attack + m2.attack) / 2);
      stats.intelligence = Math.floor((m1.intelligence + m2.intelligence) / 2);
      stats.defense = Math.floor((m1.defense + m2.defense) / 2);
      stats.speed = Math.floor((m1.speed + m2.speed) / 2);
    }

    return (
      <div
        className={
          "party-member-stats" + (stats.health === "--" ? " empty" : "")
        }
      >
        <span>
          <img
            src={icon_health}
            className="class-icon"
            alt={"stat-health"}
            title="Health"
          />
          <span>{stats.health}</span>
        </span>
        <span>
          <img
            src={icon_attack}
            className="class-icon"
            alt={"stat-attack"}
            title="Attack"
          />
          <span>{stats.attack}</span>
        </span>
        <span>
          <img
            src={icon_intelligence}
            className="class-icon"
            alt={"stat-health"}
            title="Intelligence"
          />
          <span>{stats.intelligence}</span>
        </span>
        <span>
          <img
            src={icon_defense}
            className="class-icon"
            alt={"stat-health"}
            title="Defense"
          />
          <span>{stats.defense}</span>
        </span>
        <span>
          <img
            src={icon_speed}
            className="class-icon"
            alt={"stat-health"}
            title="Speed"
          />
          <span>{stats.speed}</span>
        </span>
      </div>
    );
  }
}

/**
 * A component representing the clickable relic button next to the monster.
 */
class MonsterPlannerRelicSlot extends PureComponent {
  render() {
    return (
      <div
        className="party-member-relic-slot"
        onClick={this.props.onClick}
        title={this.props.relicName}
      >
        <div
          className="relic-sprite"
          style={{
            backgroundImage:
              "url(/siralim-planner/relic_icons/" +
              this.props.sprite_filename +
              ")",
          }}
        ></div>
      </div>
    );
  }
}

/**
 * A component representing the clickable note button next to the monster.
 */
class MonsterPlannerNoteSlot extends PureComponent {

  render() {
    return (
        <div className="party-member-note-slot" onClick={this.props.onClick} title="Note for this monster">
          <div className="note-icon"><FontAwesomeIcon icon={faStickyNote} /></div>
        </div>
    )
  }
}

/**
 * A component representing a single party member on the Monster Planner interface.
 * @property {String} state.monsterClass The class of the monster.
 */
class MonsterPlannerPartyMember extends PureComponent {
  /**
   * The constructor.
   * @param  {Object} props The props.
   */
  constructor(props) {
    super(props);
    this.state = {
      monsterClass: "empty",
    };
  }

  /**
   * When component mounts, get the class of this monster.
   */
  componentDidMount() {
    this.setState({
      monsterClass: this.getMonsterClass(),
    });
  }

  /**
   * When component updates, get the class of this monster.
   */
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps, this.props)) {
      this.setState({
        monsterClass: this.getMonsterClass(),
      });
    }
    ReactTooltip.rebuild();
  }

  /**
   * A function to get the class of this monster, which is based on the first and second monster
   * of this party member.
   * @return {String} The class name of this monster, or "empty" if it has no class.
   */
  getMonsterClass() {
    const pm1 = this.props.partyMember[0].monster;
    const pm2 = this.props.partyMember[1].monster;
    if (pm2 && pm2.class) {
      return pm2.class;
    } else if (pm1 && pm1.class) {
      return pm1.class;
    }
    return "empty";
  }

  /**
   * The render function.
   * @return {ReactComponent} A div representing this party member.
   */
  render() {
    return (
      <div
        className={
          "monster-planner-party-member cls-" +
          this.state.monsterClass.toLowerCase()
        }
      >
        <div
          className={
            "party-member-profile cls-" + this.state.monsterClass.toLowerCase()
          }
        >
          <MonsterPlannerRelicSlot
            onClick={this.props.onRelicClick}
            relicName={
              this.props.relic ? this.props.relic.name : "No relic selected"
            }
            sprite_filename={
              this.props.relic
                ? this.props.relic.abbreviation.toLowerCase() + ".png"
                : null
            }
          />
          <MonsterPlannerCreatureSprite
            sprite_filename={
              this.props.partyMember[0].monster
                ? this.props.partyMember[0].monster.sprite_filename
                : null
            }
          />
          <MonsterPlannerCreatureStats
            monster_1={this.props.partyMember[0].monster}
            monster_2={this.props.partyMember[1].monster}
          />
          <MonsterPlannerCreatureClass monsterClass={this.state.monsterClass} />

          <MonsterPlannerNoteSlot onClick={this.props.onNoteClick} />
        </div>
        <div
          className={
            "party-member-traits cls-" + this.state.monsterClass.toLowerCase()
          }
        >
          {this.props.partyMember.map((traitSlot, i) => (
            <MonsterPlannerTraitSlot
              monster={traitSlot.monster}
              error={traitSlot.error}
              rowId={"" + this.props.partyMemberId + "-" + i}
              key={i}
              traitSlotIndex={i}
              draggable="true"
              onDragStart={() =>
                this.props.onDragStart({
                  partyMemberId: this.props.partyMemberId,
                  traitSlotId: i,
                })
              }
              onDragOver={() =>
                this.props.onDragOver({
                  partyMemberId: this.props.partyMemberId,
                  traitSlotId: i,
                })
              }
              onDrop={() =>
                this.props.onDrop({
                  partyMemberId: this.props.partyMemberId,
                  traitSlotId: i,
                })
              }
              onMouseUp={() =>
                this.props.onMouseUp(
                  this.props.partyMemberId,
                  i,
                  traitSlot.monster ? traitSlot.monster : null
                )
              }
              clearPartyMember={() =>
                this.props.clearPartyMember(this.props.partyMemberId, i)
              }
            />
          ))}
        </div>
        <div className={"party-member-spells"}>
          {this.props.spells.map((spell, i) =>
              <MonsterPlannerSpellSlot
                  spell={spell}
                  key={i}
                  spellSlotIndex={i}
                  onClick={this.props.onSpellClick(i)}
                  /*draggable="true"*/
              />
          )}
          <MonsterPlannerSpellSlot
              spell={false}
              key={this.props.spells.length}
              spellSlotIndex={this.props.spells.length}
              onClick={this.props.onSpellClick(this.props.spells.length)}
          />
        </div>
      </div>
    );
  }
}

/**
 * The relic selection modal.
 */
class RelicSelectionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentRelic: null,
    };
  }

  /**
   * When component updates, and the relic has changed in the parent
   * and this component does not yet have a relic, set the relic
   * to the first one in the parent component.
   * @param  {Object} prevProps The previous props.
   * @param  {Object} prevState The previous state.
   */
  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps.currentRelic, this.props.currentRelic)) {
      this.setState({
        currentRelic: this.props.currentRelic
          ? this.props.currentRelic
          : this.props.relicsList[0],
      });
    }
  }

  /**
   * Handle the relic change, i.e. change this.state.relic
   * to the provided relic.
   * @param  {obj} relic The relic to update to.
   */
  handleRelicChange(relic) {
    let currentRelic = null;
    for (let r of this.props.relicsList) {
      if (r.abbreviation === relic.abbreviation) {
        currentRelic = r;
        break;
      }
    }
    this.setState({
      currentRelic: currentRelic,
    });
  }

  /**
   * Get the icon corresponding to this relic's stat bonus.
   * @param  {str} stat The stat to get the icon of.
   * @return {React.component}      The icon.
   */
  getStatIcon(stat) {
    let statIcon;
    if (stat === "Health") statIcon = icon_health;
    if (stat === "Attack") statIcon = icon_attack;
    if (stat === "Intelligence") statIcon = icon_intelligence;
    if (stat === "Defense") statIcon = icon_defense;
    if (stat === "Speed") statIcon = icon_speed;
    return statIcon;
  }

  /**
   * The render function. Is super long and needs breaking down into smaller components.
   * @return {ReactComponent} The anointments modal.
   */
  render() {
    return (
      <Modal
        className="modal-content modal-content-info relic-selection-modal modal-wide "
        overlayClassName="modal-overlay modal-overlay-info is-open"
        isOpen={this.props.modalIsOpen}
      >
        <div className="modal-header">
          <h3>
            Relics{" "}
            <span style={{ marginLeft: "20px" }}>
              (currently selected:{" "}
              {this.props.currentRelic ? this.props.currentRelic.name : "None"})
            </span>
          </h3>
          <button
            id="close-upload-party-modal"
            className="modal-close"
            onClick={this.props.closeModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="info-modal specialization-selection relic-selection">
          <nav className="specialization-selection-nav">
            {this.props.relicsList.map((s, i) => (
              <div
                key={i}
                className={
                  "specialization-option " +
                  (_.isEqual(this.state.currentRelic, s) ? "current" : "") +
                  (_.isEqual(s, this.props.currentRelic)
                    ? " has-anointment"
                    : "")
                }
                onClick={() => this.handleRelicChange(s)}
              >
                <span
                  className="option-icon"
                  style={{
                    backgroundImage:
                      "url(/siralim-planner/relic_icons/" +
                      s.abbreviation.toLowerCase() +
                      "_sm.png)",
                  }}
                ></span>
                {s.name}
              </div>
            ))}
          </nav>
          <div className="specialization-selection-list">
            <div className="relic-name-header">
              <div className="relic-name-header-name">
                <h2 className="no-border-bottom">
                  {this.state.currentRelic && (
                    <span
                      className="relic-icon"
                      style={{
                        backgroundImage:
                          "url(/siralim-planner/relic_icons/" +
                          this.state.currentRelic.abbreviation.toLowerCase() +
                          ".png)",
                      }}
                    ></span>
                  )}
                  {this.state.currentRelic && this.state.currentRelic.name}
                </h2>
                <h5>
                  {this.state.currentRelic && "Stat bonus: "}
                  {this.state.currentRelic && (
                    <img
                      className="relic-stat-icon"
                      src={this.getStatIcon(this.state.currentRelic.stat_bonus)}
                      alt="Stat bonus icon"
                    />
                  )}
                  {this.state.currentRelic &&
                    this.state.currentRelic.stat_bonus}
                </h5>
              </div>
              <div className="relic-name-header-button">
                {_.isEqual(this.state.currentRelic, this.props.currentRelic) ? (
                  <button
                    className="selected"
                    onClick={() =>
                      this.props.updateRelic(this.state.currentRelic)
                    }
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Selected
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      this.props.updateRelic(this.state.currentRelic)
                    }
                  >
                    <FontAwesomeIcon icon={faSave} />
                    Save
                  </button>
                )}
              </div>
            </div>
            <table id="relic-perks-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {this.state.currentRelic &&
                  this.state.currentRelic.perks &&
                  this.state.currentRelic.perks.map((perk, i) => (
                    <tr key={i}>
                      <td>{perk.rank}</td>
                      <td>{perk.description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    );
  }
}

/**
 * The note entry modal.
 */
class NoteModal extends Component {

  constructor(props) {
    super(props);
    this.changeNote = this.changeNote.bind(this);
  }

  /**
   * When component updates, and the relic has changed in the parent
   * and this component does not yet have a relic, set the relic
   * to the first one in the parent component.
   * @param  {Object} prevProps The previous props.
   * @param  {Object} prevState The previous state.
   */
  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevProps.currentNote, this.props.currentNote))
    {
      this.setState({
        currentNote: this.props.currentNote ? this.props.currentNote : ""
      })
    }
  }

  changeNote(event) {
    this.props.updateNote(event.target.value);
  }

  /**
   * The render function. Is super long and needs breaking down into smaller components.
   * @return {ReactComponent} The anointments modal.
   */
  render() {
    return (
      <Modal className="modal-content modal-content-info relic-selection-modal modal-wide "
             overlayClassName="modal-overlay modal-overlay-info is-open" isOpen={this.props.modalIsOpen}>
        <div className="modal-header">
          <h3>Monster Note</h3>
          <button id="close-upload-party-modal" className="modal-close" onClick={this.props.closeModal}><FontAwesomeIcon icon={faTimes} /></button>
        </div>

        <div className="info-modal">
          <DebounceInput className="note-box" debounceTimeout={200} element="textarea" placeholder="Write a note about this monster..." onChange={this.changeNote} value={this.props.currentNote} />
        </div>
      </Modal>

    )
  }
}

/**
 * The monster planner interface (i.e. the section with 6 party members).
 * Drag and drop Code found here: https://codepen.io/frcodecamp/pen/OEovqx
 * @property {Boolean} state.dragging Whether the user is currently dragging a trait.
 * @property {Ref} myRef A reference for the element of this div.
 */
class MonsterPlanner extends Component {
  /**
   * The constructor
   * @param  {Object} props The props.
   */
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      relicIndex: null, // Index of most recently selected relic.
      spellIndex: null,
      spellSlotIndex: null,
      noteIndex: null,
    }
    this.myRef = React.createRef();
  }

  // A function to handle the drag start (i.e. when a row is dragged).

  /**
   * A function to handle the drag start (i.e. when a row is dragged).
   * @param  {Object} data The data from the drag event.
   */
  handleDragStart = (data) => (event) => {
    let fromItem = JSON.stringify({
      partyMemberId: data.partyMemberId,
      traitSlotId: data.traitSlotId,
    });
    event.dataTransfer.setData("dragContent", fromItem);
    this.setState({
      dragging: true,
    });
  };

  /**
   * A function to handle the drag over event.
   * @param  {Object} data The data from the drag event.
   */
  handleDragOver = (data) => (event) => {
    event.preventDefault(); // Necessary. Allows us to drop.
    this.setState({
      dragging: false,
    });
    return false;
  };

  /**
   * A function to handle the event when dragging something and the mouse button is released.
   * When this happens, the rows are swapped.
   * @param  {Object} data The data from the drag event.
   */
  handleDrop = (data) => (event) => {
    event.preventDefault();

    let fromItem = JSON.parse(event.dataTransfer.getData("dragContent"));
    let toItem = {
      partyMemberId: data.partyMemberId,
      traitSlotId: data.traitSlotId,
    };

    this.swapItems(fromItem, toItem);
    return false;
  };

  // A function to swap two items.
  // Once this swap is complete, pass this update to the parent component
  // so that the monsterPlannerRows are updated.
  // These changes will get propagated back to this component.

  /**
   * A function to swap two items.
   * Once this swap is complete, pass this update to the parent component
   * so that the monsterPlannerRows are updated.
   * These changes will get propagated back to this component.
   * @param  {Object} fromItem The swapper.
   * @param  {Object} toItem   The swapee.
   */
  swapItems = (fromItem, toItem) => {
    let partyMembers = [...this.props.partyMembers];

    let fromPID = fromItem.partyMemberId;
    let fromTID = fromItem.traitSlotId;

    let toPID = toItem.partyMemberId;
    let toTID = toItem.traitSlotId;

    let fromObj = { ...this.props.partyMembers[fromPID][fromTID] };
    let toObj = { ...this.props.partyMembers[toPID][toTID] };

    partyMembers[fromPID][fromTID] = toObj;
    partyMembers[toPID][toTID] = fromObj;

    this.setState({ dragging: false }, () =>
      this.props.updatePartyMembers(partyMembers)
    );
  };

  // When the mouse button is released while hovering over a row,
  // call the openModal function on the parent of this component.
  // i.e. Open the MonsterSelection modal when a row is clicked.

  /**
   * When the mouse button is released while hovering over a row,
   * call the openModal function on the parent of this component.
   * i.e. Open the MonsterSelection modal when a row is clicked.
   * @param  {String} partyMemberId The id of the party member that was clicked. (0, 1, 2, 3, 4, 5)
   * @param  {String} traitSlotId   The id of the trait slot that was clicked (0, 1, 2)
   * @param  {Object} monster       The monster in the trait slot.
   */
  handleMouseUp(partyMemberId, traitSlotId, monster) {
    this.props.openModal(partyMemberId, traitSlotId, monster);
  }

  /**
   * Update the relic at the current index to a new relic.
   * @param  {Object} newRelic The relic to update the relic at state.relicIndex to.
   */
  updateRelic(newRelic) {
    const relicIndex = this.state.relicIndex;
    let newRelics = [];
    for (let i = 0; i < this.props.relics.length; i++) {
      newRelics[i] = this.props.relics[i];
      if (i === relicIndex) {
        newRelics[i] = newRelic;
      }
    }
    this.props.updateRelics(newRelics);
  }

  /**
   * Update the spell at the current index to a new spell.
   * @param  {Object} newSpell The spell to update the spell at state.spellIndex to.
   */
  updateSpell(newSpell) {
    if(!newSpell) {
      if(this.state.spellSlotIndex >= this.props.spells[this.state.spellIndex].length)
        return; // Do nothing - should be blocked
      this.props.spells[this.state.spellIndex][this.state.spellSlotIndex] = false;
      while(this.props.spells[this.state.spellIndex].length && !this.props.spells[this.state.spellIndex][this.props.spells[this.state.spellIndex].length - 1]) {
        this.props.spells[this.state.spellIndex].pop();
      }
    } else {
      if (this.state.spellSlotIndex >= this.props.spells[this.state.spellIndex].length)
        this.props.spells[this.state.spellIndex].push(newSpell);
      else this.props.spells[this.state.spellIndex][this.state.spellSlotIndex] = newSpell;
    }
    this.closeSpellModal();
    this.props.updateSpells(this.props.spells);
  }

  /**
   * Update the note at the current index to a new note.
   * @param  {Object} newNote The note to update the note at state.noteIndex to.
   */
  updateNote(newNote) {
    this.props.notes[this.state.noteIndex] = newNote;
    this.props.updateNotes(this.props.notes);
  }

  /**
   * Open the relic selection modal for the given relic index.
   * @param  {int} relicIndex Index of the relic that was clicked.
   */
  openRelicModal(relicIndex) {
    this.setState({
      relicModalIsOpen: true,
      relicIndex: relicIndex,
    });
  }

  /**
   * Open the note selection modal for the given note index.
   * @param  {int} noteIndex Index of the note that was clicked.
   */
  openNoteModal(noteIndex) {
    this.setState({
      noteModalIsOpen: true,
      noteIndex: noteIndex
    })
  }

  /**
   * Open the spell selection modal for the given spell index.
   * @param  {int} spellIndex Index of the spell that was clicked.
   */
  openSpellModal(spellIndex, spellSlot) {
    this.setState({
      spellModalIsOpen: true,
      spellIndex: spellIndex,
      spellSlotIndex: spellSlot,
    })
  }

  /**
   * Close the relic modal.
   */
  closeRelicModal() {
    this.setState({
      relicModalIsOpen: false,
      relicIndex: null,
    });
  }

  /**
   * Close the note modal.
   */
  closeNoteModal() {
    this.setState({
      noteModalIsOpen: false,
      noteIndex: null,
    })
  }

  /**
   * Close the spell modal.
   */
  closeSpellModal() {
    this.setState({
      spellModalIsOpen: false,
      spellIndex: null,
      spellNumber: null,
    })
  }

  /**
   * The render function.
   * @return {ReactComponent} A div containing the Monster Planner interface.
   */
  render() {
    return (
      <div id="monster-planner" ref={this.myRef}>
        <RelicSelectionModal
          modalIsOpen={this.state.relicModalIsOpen}
          closeModal={this.closeRelicModal.bind(this)}
          relicsList={this.props.relicsList}
          currentRelic={this.props.relics[this.state.relicIndex]}
          relicIndex={this.state.relicIndex}
          updateRelic={this.updateRelic.bind(this)}
        />
        <NoteModal
            modalIsOpen={this.state.noteModalIsOpen}
            closeModal={this.closeNoteModal.bind(this)}

            currentNote={this.props.notes[this.state.noteIndex]}
            noteIndex={this.state.relicIndex}
            updateNote={this.updateNote.bind(this)}
        />
        <SpellSelectionModal
            modalIsOpen={this.state.spellModalIsOpen}
            closeModal={this.closeSpellModal.bind(this)}

            spellsList={this.props.spellsList}
            currentSpell={this.props.spells[this.state.spellIndex]}
            spellIndex={this.state.spellIndex}
            spellSlotIndex={this.state.spellSlotIndex}
            updateSpell={this.updateSpell.bind(this)}
        />


        <h3 className="section-title">Party</h3>
        {this.props.partyMembers.map((partyMember, i) => (
          <MonsterPlannerPartyMember
            key={i}
            partyMember={partyMember}
            clearPartyMember={this.props.clearPartyMember}
            partyMemberId={i}
            relic={this.props.relics[i]}
            spells={this.props.spells[i]}
            onRelicClick={() => this.openRelicModal(i)}
            onNoteClick={() => this.openNoteModal(i)}
            onSpellClick={(j) => () => this.openSpellModal(i, j)}

            onDragStart={this.handleDragStart.bind(this)}
            onDragOver={this.handleDragOver.bind(this)}
            onDrop={this.handleDrop.bind(this)}
            onMouseUp={this.handleMouseUp.bind(this)}
          />
        ))}
      </div>
    );
  }
}

export default MonsterPlanner;
