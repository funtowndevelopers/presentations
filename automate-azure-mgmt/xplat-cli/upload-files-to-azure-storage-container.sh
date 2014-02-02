#! /bin/bash
# Upload all the files from a local folder to an azure storage container.

usage()
{
    cat << EOF
    usage: $0 options

    OPTIONS:
       -d      The local folder from which files will be upload to azure storage blob.
       -a      The azure storage account.
       -c      The azure stroage container.
       -n      If specified, will create a new storage account/container if the specified ones do not exist.
    EOF
}

while getopts 'd:a:c:rn' opt; do
    case $opt in
        d)
            directory=$OPTARG
            ;;
        a)
            account=$OPTARG
            ;;
        c)
            container=$OPTARG
            ;;
        n)
            create_new=1
            ;;
        ?)
            usage
            ;;
    esac
done

# create the storage account if it doesn't exist
a=$(azure storage account show $account --json | jq '.serviceName')
if [[ -z $a && $create_new = 1 ]]; then
    azure storage account create --location 'west us' $account
fi

# get the access key
key=$(azure storage account keys list $account --json | jq '.primaryKey' | sed -e 's/^"//' -e 's/"$//')

# set env variable for later storage commands
export AZURE_STORAGE_ACCESS_KEY=$key
export AZURE_STORAGE_ACCOUNT=$account

# create the storage container if it doesn't exist
c=$(azure storage container show $container --json | jq '.name')
if [[ -z $c && $create_new = 1 ]]; then
    azure storage container create -p Container $container
fi

# loop files and upload
filter="$directory*"
for file in $filter; do
    azure storage blob upload -q $file $container $(basename $file)
done
