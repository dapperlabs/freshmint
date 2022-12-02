import {{ contractName }} from {{{ contractAddress }}}

transaction(
    mintIDs: [String],
    sizes: [UInt64],
    {{#each fields}}
    {{ this.name }}: [{{ this.asCadenceTypeString }}],
    {{/each}}
) {
    
    let admin: &{{ contractName }}.Admin

    prepare(signer: AuthAccount) {
        self.admin = signer.borrow<&{{ contractName }}.Admin>(from: {{ contractName }}.AdminStoragePath)
            ?? panic("Could not borrow a reference to the NFT admin")
    }

    execute {        
        for i, mintID in mintIDs {
            self.admin.createEdition(
                mintID: mintID,
                size: sizes[i],
                {{#each fields}}
                {{ this.name }}: {{ this.name }}[i],
                {{/each}}
            )        
        }
    }
}
