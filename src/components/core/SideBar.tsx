import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Cog8ToothIcon, PlusIcon, Squares2X2Icon} from "@heroicons/react/24/outline";
import {CloseSideBarIcon, iconProps, OpenSideBarIcon} from "../../svg";
import {useTranslation} from 'react-i18next';
import Tooltip from "../ui-elements/Tooltip";
import UserSettingsModal from '../settings-modals/UserSettingsModal';
import ChatShortcuts from '../chat-related/ChatShortcuts';
import ConversationList from "../chat-related/ConversationList";

interface SidebarProps {
  className: string;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({className, isSidebarCollapsed, toggleSidebarCollapse}) => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isSidebarCollapsed);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(isSidebarCollapsed);
    }
  }, [isMobile, isSidebarCollapsed]);

  const openSettingsDialog = () => {
    setSettingsModalVisible(true);
  }

  const handleNewChat = () => {
    navigate('/', {state: {reset: Date.now()}});
  }

  const handleOnClose = () => {
    setSettingsModalVisible(false);
  }

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isMobile) {
      toggleSidebarCollapse();
    }
  }

  return (
    <div className={`${className} ${isCollapsed ? 'w-0' : 'w-auto'}`}>
      {isCollapsed && (
        <div className="absolute top-0 left-0 z-50" style={{ top: isMobile ? '50px' : '0' }}>
          <Tooltip title={t('open-sidebar')} side="right" sideOffset={10}>
            <button
              className="flex px-3 min-h-[44px] py-1 gap-3 transition-colors duration-200 dark:text-white
              cursor-pointer text-sm rounded-md border dark:border-white/20 hover:bg-gray-300 dark:hover:bg-gray-600
              h-11 w-11 flex-shrink-0 items-center justify-center bg-white dark:bg-transparent"
              onClick={handleToggleSidebar}>
              <OpenSideBarIcon/>
            </button>
          </Tooltip>
        </div>
      )}
      <UserSettingsModal
        isVisible={isSettingsModalVisible}
        onClose={handleOnClose}
      />
      <div
        className="sidebar duration-500 transition-all h-full flex-shrink-0 overflow-x-hidden dark:bg-gray-900">
        <div className="h-full w-[260px]">
          <div className="flex h-full min-h-0 flex-col ">
            <div className="scrollbar-trigger relative h-full flex-1 items-start border-white/20">
              <h2 className="sr-only">Chat history</h2>
              <nav className="flex h-full flex-col p-2" aria-label="Chat history">
                <div className="mb-1 flex flex-row gap-2">
                  <button className="flex px-3 min-h-[44px] py-1 items-center gap-3
                       transition-colors duration-200 dark:text-white
                       cursor-pointer text-sm rounded-md border dark:border-white/20 hover:bg-gray-500/10 h-11
                       bg-white dark:bg-transparent flex-grow overflow-hidden"
                          onClick={handleNewChat}
                          type="button"
                  >
                    <PlusIcon {...iconProps} />
                    <span className="truncate">{t('new-chat')}</span>
                  </button>
                  <Tooltip title={t('open-settings')} side="right" sideOffset={10}>
                    <button
                      type="button"
                      className="flex px-3 min-h-[44px] py-1 gap-3 transition-colors duration-200 dark:text-white
                      cursor-pointer text-sm rounded-md border dark:border-white/20 hover:bg-gray-500/10 h-11 w-11
                      flex-shrink-0 items-center justify-center bg-white dark:bg-transparent"
                      onClick={openSettingsDialog}>
                      <Cog8ToothIcon/>
                    </button>
                  </Tooltip>
                  <Tooltip title={t('close-sidebar')} side="right" sideOffset={10}>
                    <button
                      className="flex px-3 min-h-[44px] py-1 gap-3 transition-colors duration-200 dark:text-white
                      cursor-pointer text-sm rounded-md border dark:border-white/20 hover:bg-gray-500/10
                      h-11 w-11 flex-shrink-0 items-center justify-center bg-white dark:bg-transparent"
                      onClick={handleToggleSidebar}
                      type="button"
                    >
                      <CloseSideBarIcon/>
                    </button>
                  </Tooltip>
                </div>
                <Link to="/explore" className="flex items-center m-2 dark:bg-gray-900 dark:text-gray-100 text-gray-900">
                  <Squares2X2Icon  {...iconProps} className="mt-1 mr-2"/>
                  <span>{t('custom-chats-header')}</span>
                </Link>
                <ChatShortcuts/>
                <ConversationList/>
                
              </nav>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 p-4 border-t dark:border-white/20">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>© Modified by <a href="https://github.com/shinyPy" target="_blank" style={{color: 'blue', fontWeight: 'bold'}} rel="noopener noreferrer">shinyPy</a></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
