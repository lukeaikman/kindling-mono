class AddVendorIdToDevices < ActiveRecord::Migration[8.1]
  def change
    add_column :devices, :vendor_id, :string
    add_index :devices, :vendor_id, unique: true
  end
end
