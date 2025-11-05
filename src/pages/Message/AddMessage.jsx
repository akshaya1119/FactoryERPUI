import React from 'react';
import { Modal, Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const AddMessage = ({
  showEditForm,
  showAddForm,
  handleSubmit,
  handleInputChange,
  formData,
  onCancel,
  customDark,
  customMid,
  customLight,
  customBtn,
  customDarkText,
  customLightText,
  customLightBorder,
  customDarkBorder
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      show={showEditForm || showAddForm}
      onHide={onCancel}
      size="lg"
      backdrop="static"
      keyboard={false}
      
    >
      <Modal.Header className={`${customDark} ${customLightText} border border-bottom-0`}>
        <Modal.Title>
          {showAddForm ? t('addMessage') : t('updateMessage')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={`${customMid} ${customLightText} border border-top-0 border-bottom-0`}>
        <Form onSubmit={handleSubmit}>
          <Row>
            {showEditForm && (
              <Col md={1}>
                <Form.Group className="mb-3" controlId="textLabelId">
                  <Form.Label className={customDarkText}>ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="textLabelId"
                    value={formData.textLabelId}
                    readOnly
                  />
                </Form.Group>
              </Col>
            )}
            <Col md={3}>
              <Form.Group className="mb-3" controlId="labelKey">
                <Form.Label className={customDarkText}>Key</Form.Label>
                <Form.Control
                  type="text"
                  name="labelKey"
                  value={formData.labelKey}
                  onChange={handleInputChange}
                  readOnly={showEditForm}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3" controlId="englishLabel">
                <Form.Label className={customDarkText}>English Label</Form.Label>
                <Form.Control
                  type="text"
                  name="englishLabel"
                  value={formData.englishLabel}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3" controlId="hindiLabel">
                <Form.Label className={customDarkText}>Hindi Label</Form.Label>
                <Form.Control
                  type="text"
                  name="hindiLabel"
                  value={formData.hindiLabel}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className={`${customDark} ${customLightText} border border-top-0`}>
        <button className="btn btn-secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button className={`btn  ${customBtn} border`} onClick={handleSubmit}>
          {t('save')}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddMessage;
