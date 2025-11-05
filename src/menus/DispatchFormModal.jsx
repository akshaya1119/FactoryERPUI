import React, { useEffect } from "react";
import { Modal, Form, Input, Button, message,DatePicker } from "antd";
import { createDispatch, updateDispatch} from "../CustomHooks/ApiServices/dispatchService";
import dayjs from "dayjs";


const DispatchFormModal = ({ show, handleClose, processId, projectId, lotNo, fetchDispatchData, editMode = false,
  editDispatchData = {} }) => {
  const [form] = Form.useForm();


useEffect(() => {
  if (show) {
    if (editMode && editDispatchData) {
      form.setFieldsValue({
        ...editDispatchData,
        dispatchDate: editDispatchData.dispatchDate ? dayjs(editDispatchData.dispatchDate) : null,
      });
    } else {
      form.resetFields();
    }
  }
}, [show, editMode, editDispatchData]);




  const onFinish = async (values) => {
    const submitData = {
      ...values,
       id: editDispatchData?.id, // Needed for PUT
      processId,
      projectId,
      lotNo,
       dispatchDate: values.dispatchDate?.toISOString(), // ISO format for backend
      status: false // Initialize dispatch with pending status
    };
  console.log(values)


   try {
      if (editMode) {
        await updateDispatch(editDispatchData.id, submitData);
        message.success("Dispatch updated successfully");
      } else {
        await createDispatch(submitData);
        message.success("Dispatch created successfully");
      }

      form.resetFields();
      handleClose(true); // signal success
    } catch (error) {
      message.error("Failed to save dispatch");
    }
  };

  
  //   try {
  //     await createDispatch(submitData);
  //     form.resetFields();
  //     handleClose(true); // Pass success=true to trigger refetch and success message
  //   } catch (error) {
  //     message.error("Failed to create dispatch");
  //   }
  // };

  return (
    <Modal
       title={editMode ? "Edit Dispatch Details" : "Dispatch Details"}
      open={show}
      onCancel={() => {
        form.resetFields();
        handleClose();
      }}
      footer={[
        <Button 
          key="cancel" 
          onClick={() => {
            form.resetFields();
            handleClose();
          }}
        >
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Submit
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Number of Boxes"
          name="boxCount"
          // rules={[{ message: "Please enter number of boxes" }]}
        >
          <Input type="number" min={1} />
        </Form.Item>

        <Form.Item
          label = "Dispatch Date"
          name="dispatchDate"
          rules={[{ required: true, message: "Please enter Dispatch date"}]} 
        >
          <DatePicker style={{ width: '100%' }} />

        </Form.Item>
        <Form.Item
          label="Messenger Name"
          name="messengerName"
          // rules={[{  message: "Please enter messenger name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Messenger Mobile Number"
          name="messengerMobile"
          // rules={[
          //   {  message: "Please enter messenger mobile number" },
          //   {
          //     pattern: /^[0-9]{10}$/,
          //     message: "Please enter valid 10 digit mobile number",
          //   },
          // ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Mode of Dispatch"
          name="dispatchMode"
          // rules={[
          //   { message: "Please enter mode of dispatch" },
          // ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Vehicle Number" name="vehicleNumber">
          <Input />
        </Form.Item>

        <Form.Item label="Driver Name" name="driverName">
          <Input />
        </Form.Item>

        <Form.Item
          label="Driver Mobile Number"
          name="driverMobile"
          // rules={[
          //   {
          //     pattern: /^[0-9]{10}$/,
          //     message: "Please enter valid 10 digit mobile number",
          //   },
          // ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DispatchFormModal;

