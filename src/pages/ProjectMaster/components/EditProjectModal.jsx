import { Form, Input, Select, Switch, Row, Col, Button } from 'antd';
import { Modal } from 'react-bootstrap';
import { BsInfoCircleFill, BsPlusCircle, BsDashCircle } from "react-icons/bs";
import { Tooltip } from 'antd';
import { useState, useEffect } from 'react';
const { Option } = Select;

const EditProjectModal = ({
  visible,
  onCancel,
  form,
  onFinish,
  groups,
  types,
  showSeriesFields,
  validateSeriesInput,
  customDarkText,
  t,
  customDark,
  customMid,
  customLight,
  customBtn,
  customLightText,
  customLightBorder,
  customDarkBorder,
  numberOfSeries,
  setNumberOfSeries,
  projectName,
  setProjectName,
  selectedGroup,
  selectedType
}) => {
  const [pageQuantities, setPageQuantities] = useState([{ pages: '', quantity: '' }]);
  
  useEffect(() => {
    const quantityThresholdValue = form.getFieldValue('quantityThreshold');
    
    if (quantityThresholdValue) {
      try {
        // First, replace single quotes with double quotes to make it a valid JSON string
        const jsonString = quantityThresholdValue.replace(/'/g, '"');
        
        // Parse the JSON string
        const parsedData = JSON.parse(jsonString);
        
        // Ensure it's an array and has entries
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // Ensure each entry has pages and quantity
          const validatedData = parsedData.map(entry => ({
            pages: entry.pages || '',
            quantity: entry.quantity || ''
          }));
          
          setPageQuantities(validatedData);
        } else {
          // Fallback to default state if no valid entries
          setPageQuantities([{ pages: '', quantity: '' }]);
        }
      } catch (error) {
        console.error('Error parsing quantity threshold:', error);
        // Fallback to default state if parsing fails
        setPageQuantities([{ pages: '', quantity: '' }]);
      }
    }
  }, [form, visible]);

  const handleAddRow = () => {
    setPageQuantities([...pageQuantities, { pages: '', quantity: '' }]);
  };

  // Remove a specific row from pageQuantities
  const handleRemoveRow = (index) => {
    const newEntries = pageQuantities.filter((_, i) => i !== index);
    setPageQuantities(newEntries);
  };

  // Handle changes to pages or quantity in a specific row
  const handlePageQuantityChange = (index, field, value) => {
    const newEntries = [...pageQuantities];
    newEntries[index][field] = value;
    setPageQuantities(newEntries);
  };

  // Format and submit data
  const handleFormSubmit = async (values) => {
    const formattedValues = {
      ...values,
      quantityThreshold: JSON.stringify(pageQuantities.filter(entry => entry.pages && entry.quantity))
        .replace(/"/g, "'"), // Use single quotes for backend consistency
    };
    await onFinish(formattedValues);
  };
  
  return (
    <Modal
      show={visible}
      onHide={onCancel}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header className={`${customDark} `}>
        <Modal.Title className={`${customLightText} `}>{t('editProject')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={`${customLight} `}>
        <Form form={form} onFinish={handleFormSubmit} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={24}>
              <Form.Item
                name="group"
                label={t('group')}
                rules={[{ required: true, message: t('pleaseSelectGroup') }]}
              >
                <Select placeholder={t('selectGroup')}>
                  {groups.map((group) => (
                    <Option key={group.id} value={group.id}>{group.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24}>
              <Form.Item
                name="type"
                label={<span className={customDarkText}>{t('type')}</span>}
                rules={[{ required: true, message: t('pleaseSelectType') }]}
              >
                <Select placeholder={t('selectType')}>
                  {types.map((type) => (
                    <Option key={type.typeId} value={type.typeId}>{type.types}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {showSeriesFields && (
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="numberOfSeries"
                  label={<span className={customDarkText}>{t('numberOfSeries')}</span>}
                  rules={[{ required: true, message: t('pleaseEnterNumberOfSeries') }]}
                >
                  <Select 
                    placeholder={t('selectNumberOfSeries')}
                    onChange={(value) => setNumberOfSeries(value)}
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <Option key={num} value={num}>{num}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="seriesNames"
                  label={<span className={customDarkText}>{t('seriesName')}</span>}
                  rules={[
                    { required: true, message: t('pleaseEnterSeriesName') },
                    { validator: validateSeriesInput }
                  ]}
                >
                  <Input 
                    placeholder={t('ENTERSERIESNAME')}
                    maxLength={numberOfSeries}
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length > numberOfSeries) {
                        // Optionally handle the case where input exceeds limit
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item
                name="name"
                label={<span className={customDarkText}>{t('projectName')}</span>}
                rules={[{ required: true, message: t('pleaseEnterProjectName') }]}
              >
                <Input 
                  placeholder={t('enterProjectName')}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  //disabled={!selectedGroup || !selectedType}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="description"
                label={<span className={customDarkText}>{t('description')}</span>}
              >
                <Input.TextArea rows={4} placeholder={t('enterDescription')} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
              label={<span className={customDarkText}>
                {t('pageQuantities')}
                <Tooltip title={t('pageQuantitiesTooltip')}>
                <BsInfoCircleFill className='ms-2'/>
                </Tooltip>
              </span>}
              >
              <div className="page-quantities-container">
                {pageQuantities.map((entry, index) => (
                <Row key={index} className="mb-2" gutter={[16, 0]}>
                  <Col xs={10}>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('enterPages')}
                    value={entry.pages}
                    onChange={(e) => handlePageQuantityChange(index, 'pages', e.target.value)}
                  />
                  </Col>
                  <Col xs={10}>
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('enterQuantity')}
                    value={entry.quantity}
                    onChange={(e) => handlePageQuantityChange(index, 'quantity', e.target.value)}
                  />
                  </Col>
                  <Col xs={4} className="d-flex align-items-center">
                  {pageQuantities.length > 1 && (
                    <BsDashCircle
                    className="text-danger cursor-pointer me-2"
                    onClick={() => handleRemoveRow(index)}
                    style={{ cursor: 'pointer' }}
                    />
                  )}
                  {index === pageQuantities.length - 1 && (
                    <BsPlusCircle
                    className="text-success cursor-pointer"
                    onClick={handleAddRow}
                    style={{ cursor: 'pointer' }}
                    />
                  )}
                  </Col>
                </Row>
                ))}
              </div>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="status"
                label={t('status')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer className={`${customDark} `}>
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button type="primary" onClick={() => form.submit()}>
          {t('save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProjectModal;
