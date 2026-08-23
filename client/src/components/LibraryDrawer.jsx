import { WarningCircle } from '@phosphor-icons/react';
import FavouriteList from './FavouriteList';
import HistoryList from './HistoryList';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Drawer from './ui/Drawer';

function Tab({ id, tab, onTab, children, count }) {
  const selected = tab === id;

  return (
    <button
      className={`type-chrome focus-ring flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
        selected
          ? 'accent-fill'
          : 'text-muted hover:bg-raised hover:text-ink active:bg-raised'
      }`}
      type="button"
      role="tab"
      id={`${id}-tab`}
      aria-selected={selected}
      aria-controls={`${id}-panel`}
      onClick={() => onTab(id)}
    >
      {children}
      <Badge tone="quiet">{count}</Badge>
    </button>
  );
}

// Both lists in one panel, so one action opens either on a narrow screen
function LibraryDrawer({
  open,
  tab,
  onTab,
  onClose,
  favourites,
  removeFavourite,
  searches,
  onRepeat,
  onForget,
  onForgetAll,
  error,
}) {
  const showing = tab === 'history' ? 'history' : 'favourites';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      label="Library"
      header={
        <div className="flex gap-1" role="tablist" aria-label="Library">
          <Tab
            id="favourites"
            tab={showing}
            onTab={onTab}
            count={favourites.length}
          >
            Favourites
          </Tab>
          <Tab id="history" tab={showing} onTab={onTab} count={searches.length}>
            History
          </Tab>
        </div>
      }
    >
      {error && (
        <p
          className="mx-3 mt-3 flex items-center gap-2 rounded-control bg-danger-surface px-3 py-2 text-sm text-danger"
          role="alert"
        >
          <WarningCircle size={16} className="shrink-0" />
          {error}
        </p>
      )}

      {showing === 'favourites' ? (
        <div
          role="tabpanel"
          id="favourites-panel"
          aria-labelledby="favourites-tab"
        >
          <FavouriteList
            favourites={favourites}
            removeFavourite={removeFavourite}
          />
        </div>
      ) : (
        <div role="tabpanel" id="history-panel" aria-labelledby="history-tab">
          <HistoryList
            searches={searches}
            onRepeat={search => {
              onRepeat(search);
              onClose();
            }}
            onForget={onForget}
          />

          {searches.length > 0 && (
            <div className="px-5 pb-5">
              <Button variant="ghost" size="sm" onClick={onForgetAll}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default LibraryDrawer;
