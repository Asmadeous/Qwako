# A home a guest has saved (the heart on a home).
class SavedListing < ApplicationRecord
  belongs_to :user
  belongs_to :listing
end
