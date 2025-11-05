import React from 'react';
import { Tree } from 'antd';
import themeStore from './../../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

const { TreeNode } = Tree;

const permissionOptions = [
  { title: 'dashboard', key: '1' },
  {
    title: 'Master Management',
    key: '2',
    children: [
      {
        title: 'User Management',
        key: '2.1',
        children: [
          {
            title: 'RolePage',
            key: '2.1.1',
            children: [
              {
                title: 'CRUD',
                key: '2.1.1.0',
                children: [
                  { title: 'create', key: '2.1.1.1' },
                  { title: 'read', key: '2.1.1.2' },
                  { title: 'update', key: '2.1.1.3' },
                  { title: 'delete', key: '2.1.1.4' },
                  { title: 'download', key: '2.1.1.5' },
                  { title: 'report', key: '2.1.1.6' },
                ],
              },
            ],
          },
          {
            title: 'addUser',
            key: '2.1.2',
            children: [
              {
                title: 'CRUD',
                key: '2.1.2.0',
                children: [
                  { title: 'create', key: '2.1.2.1' },
                  { title: 'read', key: '2.1.2.2' },
                  { title: 'update', key: '2.1.2.3' },
                  { title: 'delete', key: '2.1.2.4' },
                  { title: 'download', key: '2.1.2.5' },
                  { title: 'report', key: '2.1.2.6' },
                ],
              },
            ],
          },
          {
            title: 'allUsers',
            key: '2.1.3',
            children: [
              {
                title: 'CRUD',
                key: '2.1.3.0',
                children: [
                  { title: 'create', key: '2.1.3.1' },
                  { title: 'read', key: '2.1.3.2' },
                  { title: 'update', key: '2.1.3.3' },
                  { title: 'delete', key: '2.1.3.4' },
                  { title: 'download', key: '2.1.3.5' },
                  { title: 'report', key: '2.1.3.6' },
                ],
              },
            ],
          },
          {
            title: 'securityQuestions',
            key: '2.1.4',
            children: [
              {
                title: 'CRUD',
                key: '2.1.4.0',
                children: [
                  { title: 'create', key: '2.1.4.1' },
                  { title: 'read', key: '2.1.4.2' },
                  { title: 'update', key: '2.1.4.3' },
                  { title: 'delete', key: '2.1.4.4' },
                  { title: 'download', key: '2.1.4.5' },
                  { title: 'report', key: '2.1.4.6' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'group',
        key: '2.2',
        children: [
          {
            title: 'CRUD',
            key: '2.2.0',
            children: [
              { title: 'create', key: '2.2.1' },
              { title: 'read', key: '2.2.2' },
              { title: 'update', key: '2.2.3' },
              { title: 'delete', key: '2.2.4' },
              { title: 'download', key: '2.2.5' },
              { title: 'report', key: '2.2.6' },
            ],
          },
        ],
      },
      {
        title: 'type',
        key: '2.3',
        children: [
          {
            title: 'CRUD',
            key: '2.3.0',
            children: [
              { title: 'create', key: '2.3.1' },
              { title: 'read', key: '2.3.2' },
              { title: 'update', key: '2.3.3' },
              { title: 'delete', key: '2.3.4' },
              { title: 'download', key: '2.3.5' },
              { title: 'report', key: '2.3.6' },
            ],
          },
        ],
      },
      {
        title: 'project',
        key: '2.4',
        children: [
          {
            title: 'CRUD',
            key: '2.4.0',
            children: [
              { title: 'create', key: '2.4.1' },
              { title: 'read', key: '2.4.2' },
              { title: 'update', key: '2.4.3' },
              { title: 'delete', key: '2.4.4' },
              { title: 'download', key: '2.4.5' },
              { title: 'report', key: '2.4.6' },
            ],
          },
        ],
      },
      {
        title: 'zone',
        key: '2.5',
        children: [
          {
            title: 'CRUD',
            key: '2.5.0',
            children: [
              { title: 'create', key: '2.5.1' },
              { title: 'read', key: '2.5.2' },
              { title: 'update', key: '2.5.3' },
              { title: 'delete', key: '2.5.4' },
              { title: 'download', key: '2.5.5' },
              { title: 'report', key: '2.5.6' },
            ],
          },
        ],
      },
      {
        title: 'camera',
        key: '2.6',
        children: [
          {
            title: 'CRUD',
            key: '2.6.0',
            children: [
              { title: 'create', key: '2.6.1' },
              { title: 'read', key: '2.6.2' },
              { title: 'update', key: '2.6.3' },
              { title: 'delete', key: '2.6.4' },
              { title: 'download', key: '2.6.5' },
              { title: 'report', key: '2.6.6' },
            ],
          },
        ],
      },
      {
        title: 'Machines',
        key: '2.7',
        children: [
          {
            title: 'CRUD',
            key: '2.7.0',
            children: [
              { title: 'create', key: '2.7.1' },
              { title: 'read', key: '2.7.2' },
              { title: 'update', key: '2.7.3' },
              { title: 'delete', key: '2.7.4' },
              { title: 'download', key: '2.7.5' },
              { title: 'report', key: '2.7.6' },
            ],
          },
        ],
      },
      { title: 'alarm', 
        key: '2.8' ,
        children: [
          {
            title: 'CRUD',
            key: '2.8.0',
            children: [
              { title: 'create', key: '2.8.1' },
              {title: 'read', key: '2.8.2'},
              {title: 'resolve', key: '2.8.3'},
            ]
          }
        ]},
      { title: 'team', key: '2.9' },
      
      { title: 'Process Settings', key: '2.10' },
    ],
  },
  { title: 'Message Management', key: '3' },
  { title: 'Reports', key: '4' },
  { title: 'Cumulative Dashboard', key: '5' },
  { title: 'Quantity Sheet', key: '6' },
];

const Permissions = ({ selectedPermissions = [], onChange }) => {
  const { t } = useTranslation();
  const defaultCheckedKeys = [...selectedPermissions];

  const onCheck = (checkedKeys) => {
    onChange(checkedKeys);
  };

  const renderTreeNodes = (data) =>
    data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={t(item.title)} key={item.key}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={t(item.title)} key={item.key} />;
    });
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const translateTreeData = (data) => {
    return data.map(item => ({
      ...item,
      title: t(item.title),
      children: item.children ? translateTreeData(item.children) : undefined
    }));
  };

  return (
    <div className={`${customLight} ${customDarkText}`} style={{ width: '100%', overflowX: 'auto' }}>
      <Tree
        checkable
        checkedKeys={defaultCheckedKeys}
        onCheck={onCheck}
        selectable={false}
        defaultExpandAll={false}
        treeData={translateTreeData(permissionOptions)}
        className={`${customLight} ${customDarkText}`}
        style={{
          backgroundColor: customLight,
          color: customDarkText,
          borderColor: customLightBorder,
          minWidth: '300px',
          fontSize: '14px'
        }}
      />
    </div>
  );
};

export default Permissions;
