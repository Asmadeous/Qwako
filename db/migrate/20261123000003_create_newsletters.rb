class CreateNewsletters < ActiveRecord::Migration[8.1]
  def change
    # Visitors who signed up in the footer. Guests with an account opt in from
    # their settings instead (users.marketing_consent_at).
    create_table :newsletter_subscribers, id: :uuid do |t|
      t.string :email, null: false
      t.datetime :confirmed_at
      t.datetime :unsubscribed_at
      t.timestamps
      t.index :email, unique: true
    end

    create_table :newsletters, id: :uuid do |t|
      t.string :subject, null: false
      t.text :body, null: false, default: ""
      t.references :sent_by, type: :uuid, foreign_key: { to_table: :users }
      t.datetime :sent_at
      t.integer :recipients_count, null: false, default: 0
      t.timestamps
    end
  end
end
