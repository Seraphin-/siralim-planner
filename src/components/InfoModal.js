import React, { PureComponent } from "react";
import InfoSection from "./InfoSection";
import Modal from "react-modal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

class InfoModal extends PureComponent {
  render() {
    return (
      <Modal
        className="modal-content modal-content-info"
        overlayClassName="modal-overlay modal-overlay-info is-open"
        isOpen={this.props.modalIsOpen}
      >
        <div className="modal-header">
          <button
            id="close-info-modal"
            className="modal-close"
            aria-label="Close info"
            onClick={this.props.closeModal}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="info-modal">
          <InfoSection />
        </div>
      </Modal>
    );
  }
}

export default InfoModal;
