import React, { useEffect, useState } from "react";
import { Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Dropdown, Menu } from "antd";
import API from "../../../CustomHooks/MasterApiHooks/api";
import { useUserData } from "../../../store/userDataStore";
import { MdKeyboardArrowDown } from "react-icons/md";

const ToggleProject = ({ projectName, selectedLot, onChange }) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const userData = useUserData();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectData = await API.get(
          `/Project/GetDistinctProjectsForUser/${userData.userId}`
        );
        const activeProjects = projectData.data.filter(
          (project) => project.status
        );
        setProjects(activeProjects);
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };
    fetchProjects();
  }, [userData.userId]);

  const handleMenuClick = (project) => {
    onChange({
      value: project.projectId,
      label: project.name,
      seriesInfo: project.noOfSeries > 0 ? ` (${project.seriesName})` : "",
    });
    setVisible(false);
  };

  const menu = (
    <div
    style={{
      maxHeight: "300px",
      overflowY: "auto",
      borderRadius: "4px",
    }}>   
    <Menu>
      {projects.map((project) => (
        <Menu.Item
          key={project.projectId}
          onClick={() => handleMenuClick(project)}
          style={{
            fontSize: "14px",
            padding: "8px 12px",
            whiteSpace: "normal",
            lineHeight: "1.2",
            wordBreak: "break-word",
          }}
        >
          {project.name}
          {project.noOfSeries > 0 ? ` (${project.seriesName})` : ""}
        </Menu.Item>
      ))}
    </Menu> </div>
  );

  const selectedProject = projects.find((p) => p.name === projectName);

  return (
    <div className="d-flex flex-column align-items-center">
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
              width: "100%",
            }}
          >
            <span className="fs-4" style={{ wordBreak: "break-word" }}>
              {projectName}
              {selectedProject?.noOfSeries > 0
                ? ` (${selectedProject.seriesName})`
                : ""}
            </span>
            <MdKeyboardArrowDown size={22} />
          </div>
        </Dropdown>
      </div>

      <div className="fs-4 mt-2">
        {t("lot")} - {selectedLot}
      </div>
    </div>
  );
};

export default ToggleProject;
