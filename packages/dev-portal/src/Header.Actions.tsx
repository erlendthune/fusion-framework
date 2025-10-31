import { tag, notifications } from '@equinor/eds-icons';
import { Button, Icon, TopBar, Badge } from '@equinor/eds-core-react';
import { useState, useEffect } from 'react';

import PersonAvatarElement from '@equinor/fusion-wc-person/avatar';
PersonAvatarElement;

import { useBookmarkComponentContext } from '@equinor/fusion-framework-react-components-bookmark';

interface HeaderActionProps {
  readonly userAzureId?: string;
  readonly toggleBookmark: (open: (status: boolean) => boolean) => void;
  readonly togglePerson: (open: (status: boolean) => boolean) => void;
}

interface NotificationData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export const HeaderActions = (props: HeaderActionProps) => {
  const { toggleBookmark, togglePerson, userAzureId } = props;
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const bookmarkContext = useBookmarkComponentContext();

  return (
    <TopBar.Actions style={{ minWidth: 48, minHeight: 48 }}>
      <Button
        onClick={() => toggleBookmark((x) => !x)}
        variant="ghost_icon"
        disabled={!bookmarkContext.provider}
        title={bookmarkContext.provider ? 'Bookmarks' : 'Bookmarks not available, enable in app'}
      >
        <Icon data={tag} />
      </Button>
      <Button onClick={() => togglePerson((x) => !x)} variant="ghost_icon">
        <fwc-person-avatar size="small" azureId={userAzureId} clickable={false} />
      </Button>
    </TopBar.Actions>
  );
};
