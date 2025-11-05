import React, { useState } from "react";
import { Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Dropdown, Menu } from "antd";
import { MdKeyboardArrowDown } from "react-icons/md";

const ToggleProcess = ({
  processes,
  initialProcessId,
  onProcessChange,
  customDark,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [processId, setProcessId] = useState(initialProcessId);

  const handleMenuClick = (process) => {
    setProcessId(process.processId);
    onProcessChange(process.processId);
    setVisible(false);
  };

  const menu = (
    <Menu>
      {processes.map((process) => (
        <Menu.Item
          key={process.processId}
          onClick={() => handleMenuClick(process)}
          style={{
            fontSize: "14px",
            padding: "8px 12px",
            whiteSpace: "normal",
            lineHeight: "1.2",
            wordBreak: "break-word",
          }}
        >
          {process.processName}
        </Menu.Item>
      ))}
    </Menu>
  );

  const selectedProcess = processes.find(p => p.processId === processId);

  return (
    <div className="d-flex flex-column align-items-center">
      <div className="text-center fs-5">{t("currentProcess")}</div>
      <div className="d-flex align-items-center">
        <Dropdown
          overlay={menu}
          trigger={["click"]}
          open={visible}
          onOpenChange={setVisible}
        >
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "100%"
            }}
          >
            <span className="fs-4" style={{wordBreak: "break-word"}}>
              {selectedProcess?.processName}
            </span>
            <MdKeyboardArrowDown size={22} />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default ToggleProcess;
